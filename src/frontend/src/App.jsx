import { Navigate, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import AdminPack from "./pages/AdminPack";
import BookConnect from "./pages/BookConnect";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Home from "./pages/Home";
import { Privacy, Refund, Terms } from "./pages/Legal";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Enroll from "./pages/Enroll";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/admin/pack-orders" element={<AdminPack />} />

      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/enroll/:slug" element={<Enroll />} />
        <Route path="/pay/interview-qa-offline" element={<Navigate to="/enroll/interview-qa-offline" replace />} />
        <Route path="/book/1on1" element={<BookConnect />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
