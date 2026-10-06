import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { apiError, formatHours } from "../lib/format";
import { BookingSummary } from "../components/listings/BookingSummary";

// Confirm → book → go agree a time. Shared by Home and public profiles.
export const useBookListing = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState(null);

  const book = async (listing) => {
    if (!user) return navigate("/login", { state: { from: window.location.pathname } });

    if (user.timeCredits < listing.creditCost) {
      toast.error(`This costs ${formatHours(listing.creditCost)}. You have ${formatHours(user.timeCredits)}. Teach a session to earn more.`);
      return;
    }

    const ok = await confirm({
      title: `Book “${listing.title}”`,
      body: <BookingSummary listing={listing} balance={user.timeCredits} />,
      confirmLabel: `Book for ${formatHours(listing.creditCost)}`,
    });
    if (!ok) return;

    setBookingId(listing._id);
    try {
      await api.post("/api/bookings", { listingId: listing._id });
      await refreshUser();
      toast.success("Booked. Now agree on a time.");
      navigate("/bookings");
    } catch (error) {
      toast.error(apiError(error, "Booking failed"));
    } finally {
      setBookingId(null);
    }
  };

  return { book, bookingId };
};
