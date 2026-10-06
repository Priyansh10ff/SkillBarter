import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import { apiError } from "../../lib/format";
import { Button, Dialog, Field, Textarea, cx } from "../ui";

const LABELS = { 1: "Didn't work", 2: "Below what I hoped", 3: "Fine", 4: "Good", 5: "Excellent" };

// Rate the other person after a completed session (one review per side)
export const ReviewDialog = ({ booking, otherName, open, onClose, onDone }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post("/api/reviews", { bookingId: booking._id, rating, comment });
      toast.success("Thanks, review posted");
      onDone();
    } catch (error) {
      toast.error(apiError(error, "Couldn't post the review"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Review your session with ${otherName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Later
          </Button>
          <Button variant="primary" disabled={!rating} loading={saving} onClick={submit}>
            Post review
          </Button>
        </>
      }
    >
      <p className="text-sm">“{booking.listingSnapshot?.title}”. Reviews show on {otherName}'s public profile.</p>
      <div className="mt-4">
        <p className="text-sm font-medium text-ink mb-2" id="rating-label">
          How was it?
        </p>
        <div role="radiogroup" aria-labelledby="rating-label" className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} out of 5, ${LABELS[n]}`}
              onClick={() => setRating(n)}
              className={cx(
                "h-11 rounded border font-mono text-lg transition-colors",
                n <= rating ? "border-ink bg-raised text-ink" : "border-line text-faint hover:text-ink hover:border-line-strong"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 h-5 font-mono text-2xs uppercase tracking-wider text-muted">{rating ? `${rating}/5 · ${LABELS[rating]}` : "Pick a score"}</p>
      </div>
      <Field label="What stood out?" hint="Optional." counter={`${comment.length}/500`} className="mt-3">
        {(p) => <Textarea {...p} rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Clear explanations, came prepared with examples." />}
      </Field>
    </Dialog>
  );
};
