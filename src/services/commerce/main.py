from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, Field

JWT_SECRET = os.getenv("JWT_SECRET", "local-dev-secret")
JWT_ALGORITHM = "HS256"
DB_PATH = Path(os.getenv("COMMERCE_DB_PATH", str(Path(__file__).resolve().parent / "commerce.db")))


# In-memory course lookup (mirrors catalog service for local demo)
CATALOG: Dict[str, Dict[str, Any]] = {
    "c-aws-devops-ai": {"title": "AWS + DevOps + AI", "price_inr": 0, "slug": "aws-devops-ai"},
    "c-job-support": {"title": "Job Support", "price_inr": 0, "slug": "job-support"},
    "c-interview-support": {"title": "Interview Support", "price_inr": 0, "slug": "interview-support"},
}


app = FastAPI(title="DevOpsMate Commerce Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS carts (
              user_id TEXT PRIMARY KEY,
              items_json TEXT NOT NULL DEFAULT '[]',
              updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS orders (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              items_json TEXT NOT NULL,
              total_inr INTEGER NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )


@app.on_event("startup")
def on_startup():
    init_db()


def require_user(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        return str(sub)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class CartItemIn(BaseModel):
    course_id: str
    qty: int = Field(default=1, ge=1, le=5)


class CartItemOut(BaseModel):
    course_id: str
    title: str
    slug: str
    price_inr: int
    qty: int
    line_total_inr: int


class CartOut(BaseModel):
    items: List[CartItemOut]
    item_count: int
    subtotal_inr: int


class CheckoutIn(BaseModel):
    accept_terms: bool = True
    accept_refund: bool = True


class OrderOut(BaseModel):
    id: str
    items: List[CartItemOut]
    total_inr: int
    status: str
    created_at: str


def load_cart_items(user_id: str) -> List[Dict[str, Any]]:
    with db() as conn:
        row = conn.execute("SELECT items_json FROM carts WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        return []
    return json.loads(row["items_json"])


def save_cart_items(user_id: str, items: List[Dict[str, Any]]) -> None:
    now = datetime.utcnow().isoformat()
    with db() as conn:
        conn.execute(
            """
            INSERT INTO carts (user_id, items_json, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET items_json = excluded.items_json, updated_at = excluded.updated_at
            """,
            (user_id, json.dumps(items), now),
        )


def enrich(items: List[Dict[str, Any]]) -> CartOut:
    out: List[CartItemOut] = []
    for it in items:
        meta = CATALOG.get(it["course_id"])
        if not meta:
            continue
        qty = int(it.get("qty", 1))
        out.append(
            CartItemOut(
                course_id=it["course_id"],
                title=meta["title"],
                slug=meta["slug"],
                price_inr=meta["price_inr"],
                qty=qty,
                line_total_inr=meta["price_inr"] * qty,
            )
        )
    return CartOut(
        items=out,
        item_count=sum(i.qty for i in out),
        subtotal_inr=sum(i.line_total_inr for i in out),
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "commerce"}


@app.get("/api/commerce/cart", response_model=CartOut)
def get_cart(authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    return enrich(load_cart_items(user_id))


@app.post("/api/commerce/cart/items", response_model=CartOut)
def add_item(payload: CartItemIn, authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    if payload.course_id not in CATALOG:
        raise HTTPException(status_code=404, detail="Course not found")
    items = load_cart_items(user_id)
    found = False
    for it in items:
        if it["course_id"] == payload.course_id:
            it["qty"] = min(5, int(it.get("qty", 1)) + payload.qty)
            found = True
            break
    if not found:
        items.append({"course_id": payload.course_id, "qty": payload.qty})
    save_cart_items(user_id, items)
    return enrich(items)


@app.patch("/api/commerce/cart/items/{course_id}", response_model=CartOut)
def update_item(course_id: str, payload: CartItemIn, authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    items = load_cart_items(user_id)
    next_items = []
    for it in items:
        if it["course_id"] == course_id:
            if payload.qty <= 0:
                continue
            it["qty"] = payload.qty
        next_items.append(it)
    save_cart_items(user_id, next_items)
    return enrich(next_items)


@app.delete("/api/commerce/cart/items/{course_id}", response_model=CartOut)
def remove_item(course_id: str, authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    items = [it for it in load_cart_items(user_id) if it["course_id"] != course_id]
    save_cart_items(user_id, items)
    return enrich(items)


@app.post("/api/commerce/checkout", response_model=OrderOut)
def checkout(payload: CheckoutIn, authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    if not payload.accept_terms or not payload.accept_refund:
        raise HTTPException(status_code=400, detail="Accept Terms and No Refund Policy to continue")
    cart = enrich(load_cart_items(user_id))
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    order_id = f"DM-{uuid.uuid4().hex[:10].upper()}"
    created = datetime.utcnow().isoformat()
    with db() as conn:
        conn.execute(
            "INSERT INTO orders (id, user_id, items_json, total_inr, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                order_id,
                user_id,
                json.dumps([i.model_dump() for i in cart.items]),
                cart.subtotal_inr,
                "confirmed",
                created,
            ),
        )
    save_cart_items(user_id, [])
    return OrderOut(
        id=order_id,
        items=cart.items,
        total_inr=cart.subtotal_inr,
        status="confirmed",
        created_at=created,
    )


@app.get("/api/commerce/orders", response_model=List[OrderOut])
def list_orders(authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return [
        OrderOut(
            id=r["id"],
            items=[CartItemOut(**i) for i in json.loads(r["items_json"])],
            total_inr=r["total_inr"],
            status=r["status"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
