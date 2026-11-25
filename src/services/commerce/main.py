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
    "c-aws-devops-ai": {"title": "AWS + DevOps + AI", "price_inr": 20000, "slug": "aws-devops-ai"},
    "c-job-support": {"title": "Job Support", "price_inr": 20000, "slug": "job-support"},
    "c-interview-support": {
        "title": "Interview Support",
        "price_inr": int(os.getenv("INTERVIEW_SUPPORT_PRICE_INR", "9999")),
        "slug": "interview-support",
    },
    "c-interview-qa-offline": {
        "title": "Real DevOps & Cloud Interview Questions",
        "price_inr": int(os.getenv("PACK_PRICE_INR", "1999")),
        "slug": "interview-qa-offline",
    },
    "c-1on1-connect": {"title": "1:1 Connect", "price_inr": 99, "slug": "1on1-connect"},
}

PACK_COURSE_ID = "c-interview-qa-offline"
CONNECT_COURSE_ID = "c-1on1-connect"
ADMIN_KEY = os.getenv("ADMIN_KEY", "dm-admin-change-me")
ADMIN_MOBILE = os.getenv("ADMIN_MOBILE", "7013274348")
UPI_ID = os.getenv("UPI_ID", "devopamate@ybl")
UPI_ID_ALT = os.getenv("UPI_ID_ALT", "balureddy123457@ybl")
AUTH_INTERNAL_URL = os.getenv("AUTH_INTERNAL_URL", "http://auth:8000").rstrip("/")

CONNECT_PRICES = {
    (5, False): 19,  # Personal advice DM
    (15, False): 99,
    (15, True): 199,
    (40, False): 199,
    (40, True): 299,
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
              created_at TEXT NOT NULL,
              email TEXT,
              buyer_name TEXT,
              course_id TEXT,
              delivered_at TEXT
            );
            CREATE TABLE IF NOT EXISTS bookings (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              buyer_name TEXT NOT NULL,
              email TEXT NOT NULL,
              mobile TEXT NOT NULL,
              duration_min INTEGER NOT NULL,
              priority INTEGER NOT NULL,
              slot_start TEXT NOT NULL,
              price_inr INTEGER NOT NULL,
              meeting_link TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
        cols = {r[1] for r in conn.execute("PRAGMA table_info(orders)").fetchall()}
        for col, ddl in (
            ("email", "ALTER TABLE orders ADD COLUMN email TEXT"),
            ("buyer_name", "ALTER TABLE orders ADD COLUMN buyer_name TEXT"),
            ("course_id", "ALTER TABLE orders ADD COLUMN course_id TEXT"),
            ("delivered_at", "ALTER TABLE orders ADD COLUMN delivered_at TEXT"),
        ):
            if col not in cols:
                conn.execute(ddl)


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
    email: Optional[str] = None
    buyer_name: Optional[str] = None
    course_id: Optional[str] = None
    delivered_at: Optional[str] = None


class PackCheckoutIn(BaseModel):
    accept_terms: bool = True
    accept_refund: bool = True
    email: str
    buyer_name: str = ""


class PackPayInfo(BaseModel):
    course_id: str
    title: str
    price_inr: int
    upi_id: str
    upi_id_alt: str


def require_admin_user(authorization: Optional[str]) -> str:
    user_id = require_user(authorization)
    if user_id != ADMIN_MOBILE:
        raise HTTPException(status_code=403, detail="Admin login required")
    return user_id


def row_to_order(r: sqlite3.Row) -> OrderOut:
    keys = r.keys()
    return OrderOut(
        id=r["id"],
        items=[CartItemOut(**i) for i in json.loads(r["items_json"])],
        total_inr=r["total_inr"],
        status=r["status"],
        created_at=r["created_at"],
        email=r["email"] if "email" in keys else None,
        buyer_name=r["buyer_name"] if "buyer_name" in keys else None,
        course_id=r["course_id"] if "course_id" in keys else None,
        delivered_at=r["delivered_at"] if "delivered_at" in keys else None,
    )


def trigger_pack_email(order_id: str, email: str, name: str) -> None:
    import json as _json
    import urllib.error
    import urllib.request

    body = _json.dumps({"order_id": order_id, "email": email, "name": name or "Student"}).encode()
    req = urllib.request.Request(
        f"{AUTH_INTERNAL_URL}/api/auth/internal/deliver-pack",
        data=body,
        headers={"Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status >= 400:
                raise HTTPException(status_code=502, detail="Pack email failed")
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="ignore")[:300]
        raise HTTPException(status_code=502, detail=f"Pack email failed: {detail}")
    except urllib.error.URLError as e:
        raise HTTPException(status_code=502, detail=f"Auth unreachable for pack email: {e.reason}")


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
    return [row_to_order(r) for r in rows]


@app.get("/api/commerce/pack/pay-info", response_model=PackPayInfo)
def pack_pay_info():
    meta = CATALOG[PACK_COURSE_ID]
    return PackPayInfo(
        course_id=PACK_COURSE_ID,
        title=meta["title"],
        price_inr=meta["price_inr"],
        upi_id=UPI_ID,
        upi_id_alt=UPI_ID_ALT,
    )


@app.post("/api/commerce/pack/checkout", response_model=OrderOut)
def pack_checkout(payload: PackCheckoutIn, authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    if not payload.accept_terms or not payload.accept_refund:
        raise HTTPException(status_code=400, detail="Accept Terms and No Refund Policy to continue")
    email = (payload.email or "").strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required for pack delivery")
    meta = CATALOG[PACK_COURSE_ID]
    item = CartItemOut(
        course_id=PACK_COURSE_ID,
        title=meta["title"],
        slug=meta["slug"],
        price_inr=meta["price_inr"],
        qty=1,
        line_total_inr=meta["price_inr"],
    )
    order_id = f"DM-{uuid.uuid4().hex[:10].upper()}"
    created = datetime.utcnow().isoformat()
    with db() as conn:
        conn.execute(
            """
            INSERT INTO orders
              (id, user_id, items_json, total_inr, status, created_at, email, buyer_name, course_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                user_id,
                json.dumps([item.model_dump()]),
                meta["price_inr"],
                "awaiting_approval",
                created,
                email,
                (payload.buyer_name or "").strip() or "Student",
                PACK_COURSE_ID,
            ),
        )
    return OrderOut(
        id=order_id,
        items=[item],
        total_inr=meta["price_inr"],
        status="awaiting_approval",
        created_at=created,
        email=email,
        buyer_name=(payload.buyer_name or "").strip() or "Student",
        course_id=PACK_COURSE_ID,
        delivered_at=None,
    )


def catalog_by_slug(slug: str) -> Dict[str, Any]:
    for course_id, meta in CATALOG.items():
        if meta["slug"] == slug or course_id == slug:
            return {"course_id": course_id, **meta}
    raise HTTPException(status_code=404, detail="Service not found")


class EnrollCheckoutIn(BaseModel):
    slug: str
    accept_terms: bool = False
    accept_refund: bool = False
    email: str = ""
    buyer_name: str = ""


@app.get("/api/commerce/enroll/pay-info/{slug}", response_model=PackPayInfo)
def enroll_pay_info(slug: str):
    if slug in ("1on1-connect", CONNECT_COURSE_ID):
        raise HTTPException(status_code=400, detail="Use /book/1on1 for 1:1 Connect")
    meta = catalog_by_slug(slug)
    return PackPayInfo(
        course_id=meta["course_id"],
        title=meta["title"],
        price_inr=int(meta["price_inr"] or 0),
        upi_id=UPI_ID,
        upi_id_alt=UPI_ID_ALT,
    )


@app.post("/api/commerce/enroll/checkout", response_model=OrderOut)
def enroll_checkout(payload: EnrollCheckoutIn, authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    if not payload.accept_terms or not payload.accept_refund:
        raise HTTPException(status_code=400, detail="Accept Terms and Refund Policy to continue")
    slug = (payload.slug or "").strip()
    if slug in ("1on1-connect", CONNECT_COURSE_ID):
        raise HTTPException(status_code=400, detail="Use /book/1on1 for 1:1 Connect")
    meta = catalog_by_slug(slug)
    email = (payload.email or "").strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    price = int(meta["price_inr"] or 0)
    if price <= 0:
        raise HTTPException(status_code=400, detail="This service has no fixed price yet")
    item = CartItemOut(
        course_id=meta["course_id"],
        title=meta["title"],
        slug=meta["slug"],
        price_inr=price,
        qty=1,
        line_total_inr=price,
    )
    order_id = f"DM-{uuid.uuid4().hex[:10].upper()}"
    created = datetime.utcnow().isoformat()
    with db() as conn:
        conn.execute(
            """
            INSERT INTO orders
              (id, user_id, items_json, total_inr, status, created_at, email, buyer_name, course_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                user_id,
                json.dumps([item.model_dump()]),
                price,
                "awaiting_approval",
                created,
                email,
                (payload.buyer_name or "").strip() or "Student",
                meta["course_id"],
            ),
        )
    return OrderOut(
        id=order_id,
        items=[item],
        total_inr=price,
        status="awaiting_approval",
        created_at=created,
        email=email,
        buyer_name=(payload.buyer_name or "").strip() or "Student",
        course_id=meta["course_id"],
        delivered_at=None,
    )


@app.get("/api/commerce/admin/pack-orders", response_model=List[OrderOut])
def admin_pack_orders(authorization: Optional[str] = Header(default=None)):
    require_admin_user(authorization)
    with db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM orders
            ORDER BY created_at DESC
            LIMIT 150
            """
        ).fetchall()
    return [row_to_order(r) for r in rows]


@app.post("/api/commerce/admin/pack-orders/{order_id}/approve", response_model=OrderOut)
def admin_approve_pack(order_id: str, authorization: Optional[str] = Header(default=None)):
    require_admin_user(authorization)
    with db() as conn:
        row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = row_to_order(row)
        if order.status in ("delivered", "confirmed"):
            return order
        email = order.email
        if not email:
            raise HTTPException(status_code=400, detail="Order has no email")
        delivered = datetime.utcnow().isoformat()
        if order.course_id == PACK_COURSE_ID:
            trigger_pack_email(order.id, email, order.buyer_name or "Student")
            status = "delivered"
        else:
            status = "confirmed"
        conn.execute(
            "UPDATE orders SET status = ?, delivered_at = ? WHERE id = ?",
            (status, delivered, order_id),
        )
        row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    return row_to_order(row)


class ConnectPayInfo(BaseModel):
    upi_id: str
    upi_id_alt: str
    prices: Dict[str, int]


class ConnectBookIn(BaseModel):
    accept_terms: bool = True
    accept_refund: bool = True
    email: str
    buyer_name: str = ""
    mobile: str = ""
    duration_min: int
    priority: bool = False
    slot_start: str


class BookingOut(BaseModel):
    id: str
    user_id: str
    buyer_name: str
    email: str
    mobile: str
    duration_min: int
    priority: bool
    slot_start: str
    price_inr: int
    meeting_link: str
    status: str
    created_at: str


def row_to_booking(r: sqlite3.Row) -> BookingOut:
    return BookingOut(
        id=r["id"],
        user_id=r["user_id"],
        buyer_name=r["buyer_name"],
        email=r["email"],
        mobile=r["mobile"],
        duration_min=int(r["duration_min"]),
        priority=bool(r["priority"]),
        slot_start=r["slot_start"],
        price_inr=int(r["price_inr"]),
        meeting_link=r["meeting_link"],
        status=r["status"],
        created_at=r["created_at"],
    )


def trigger_connect_email(booking: BookingOut, kind: str) -> None:
    import json as _json
    import urllib.error
    import urllib.request

    body = _json.dumps(
        {
            "kind": kind,
            "booking_id": booking.id,
            "name": booking.buyer_name,
            "email": booking.email,
            "mobile": booking.mobile,
            "duration_min": booking.duration_min,
            "priority": booking.priority,
            "slot_start": booking.slot_start,
            "price_inr": booking.price_inr,
            "meeting_link": booking.meeting_link or "",
        }
    ).encode()
    req = urllib.request.Request(
        f"{AUTH_INTERNAL_URL}/api/auth/internal/notify-connect",
        data=body,
        headers={"Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status >= 400:
                raise HTTPException(status_code=502, detail="Connect email failed")
    except urllib.error.HTTPError as e:
        detail = e.read().decode() if e.fp else str(e)
        raise HTTPException(status_code=502, detail=f"Connect email failed: {detail}")
    except urllib.error.URLError as e:
        raise HTTPException(status_code=502, detail=f"Auth unreachable for connect email: {e.reason}")


@app.get("/api/commerce/connect/pay-info", response_model=ConnectPayInfo)
def connect_pay_info():
    return ConnectPayInfo(
        upi_id=UPI_ID,
        upi_id_alt=UPI_ID_ALT,
        prices={
            "5": CONNECT_PRICES[(5, False)],
            "15": CONNECT_PRICES[(15, False)],
            "15p": CONNECT_PRICES[(15, True)],
            "40": CONNECT_PRICES[(40, False)],
            "40p": CONNECT_PRICES[(40, True)],
        },
    )


@app.post("/api/commerce/connect/book", response_model=BookingOut)
def connect_book(payload: ConnectBookIn, authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    if not payload.accept_terms or not payload.accept_refund:
        raise HTTPException(status_code=400, detail="Accept Terms and No Refund Policy to continue")
    email = (payload.email or "").strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    if payload.duration_min not in (5, 15, 40):
        raise HTTPException(status_code=400, detail="Pick ₹19 advice, 15 min, or 40 min")
    priority = False if payload.duration_min == 5 else bool(payload.priority)
    price = CONNECT_PRICES.get((payload.duration_min, priority))
    if price is None:
        raise HTTPException(status_code=400, detail="Invalid plan")
    slot = (payload.slot_start or "").strip()
    if payload.duration_min == 5:
        # Priority DM — no calendar / Zoom; WhatsApp reply only
        slot = slot if len(slot) >= 4 else "dm-whatsapp"
    elif len(slot) < 10:
        raise HTTPException(status_code=400, detail="Pick a date and time")
    booking_id = f"C1-{uuid.uuid4().hex[:10].upper()}"
    created = datetime.utcnow().isoformat()
    booking = BookingOut(
        id=booking_id,
        user_id=user_id,
        buyer_name=(payload.buyer_name or "").strip() or "Student",
        email=email,
        mobile=(payload.mobile or user_id or "").strip(),
        duration_min=payload.duration_min,
        priority=priority,
        slot_start=slot,
        price_inr=price,
        meeting_link="",
        status="awaiting_approval",
        created_at=created,
    )
    with db() as conn:
        if payload.duration_min != 5:
            clash = conn.execute(
                "SELECT id FROM bookings WHERE slot_start = ? AND status != 'cancelled' AND duration_min != 5",
                (slot,),
            ).fetchone()
            if clash:
                raise HTTPException(status_code=409, detail="That slot is already booked. Pick another time.")
        conn.execute(
            """
            INSERT INTO bookings
              (id, user_id, buyer_name, email, mobile, duration_min, priority, slot_start,
               price_inr, meeting_link, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                booking.id,
                booking.user_id,
                booking.buyer_name,
                booking.email,
                booking.mobile,
                booking.duration_min,
                1 if booking.priority else 0,
                booking.slot_start,
                booking.price_inr,
                booking.meeting_link,
                booking.status,
                booking.created_at,
            ),
        )
    trigger_connect_email(booking, "admin_pending")
    return booking


@app.get("/api/commerce/my/bookings", response_model=List[BookingOut])
def my_bookings(authorization: Optional[str] = Header(default=None)):
    user_id = require_user(authorization)
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    return [row_to_booking(r) for r in rows]


@app.get("/api/commerce/admin/bookings", response_model=List[BookingOut])
def admin_bookings(authorization: Optional[str] = Header(default=None)):
    require_admin_user(authorization)
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM bookings ORDER BY created_at DESC LIMIT 100"
        ).fetchall()
    return [row_to_booking(r) for r in rows]


@app.post("/api/commerce/admin/reset-data")
def admin_reset_data(authorization: Optional[str] = Header(default=None)):
    """Clear bookings, orders, and carts for a fresh production release."""
    require_admin_user(authorization)
    with db() as conn:
        bookings = conn.execute("SELECT COUNT(*) AS c FROM bookings").fetchone()["c"]
        orders = conn.execute("SELECT COUNT(*) AS c FROM orders").fetchone()["c"]
        carts = conn.execute("SELECT COUNT(*) AS c FROM carts").fetchone()["c"]
        conn.execute("DELETE FROM bookings")
        conn.execute("DELETE FROM orders")
        conn.execute("DELETE FROM carts")
    return {
        "ok": True,
        "deleted": {"bookings": bookings, "orders": orders, "carts": carts},
    }


@app.post("/api/commerce/admin/bookings/{booking_id}/approve", response_model=BookingOut)
def admin_approve_booking(booking_id: str, authorization: Optional[str] = Header(default=None)):
    require_admin_user(authorization)
    from zoom import create_meeting

    with db() as conn:
        row = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Booking not found")
        booking = row_to_booking(row)
        if booking.status == "confirmed" and (booking.meeting_link or booking.duration_min == 5):
            return booking
        if booking.duration_min == 5:
            conn.execute(
                "UPDATE bookings SET meeting_link = ?, status = ? WHERE id = ?",
                ("dm-advice", "confirmed", booking_id),
            )
            row = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
            booking = row_to_booking(row)
            return booking
        try:
            meeting = create_meeting(
                topic=f"DevOpsMate 1:1 — {booking.buyer_name} ({booking.id})",
                start_iso=booking.slot_start,
                duration_min=booking.duration_min,
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e)) from e
        join_url = (meeting.get("join_url") or "").strip()
        if not join_url:
            raise HTTPException(status_code=502, detail="Zoom did not return a join_url")
        conn.execute(
            "UPDATE bookings SET meeting_link = ?, status = ? WHERE id = ?",
            (join_url, "confirmed", booking_id),
        )
        row = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        booking = row_to_booking(row)
    trigger_connect_email(booking, "user_approved")
    return booking
