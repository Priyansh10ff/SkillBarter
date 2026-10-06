import { useEffect, useState } from "react";
import api from "../../api/client";
import { formatDate } from "../../lib/format";
import { Avatar, EmptyState, Panel, PanelHeader, SkeletonRows } from "../ui";

export const Rating = ({ value, count, className = "" }) =>
  count ? (
    <span className={`font-mono tabular ${className}`} title={`${value.toFixed(1)} out of 5 from ${count} review${count === 1 ? "" : "s"}`}>
      ★ {value.toFixed(1)} <span className="text-faint">({count})</span>
    </span>
  ) : (
    <span className={`font-mono text-faint ${className}`}>no reviews yet</span>
  );

// Reviews a member has received
export const ReviewList = ({ userId, name }) => {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/reviews/user/${userId}`)
      .then(({ data }) => alive && setReviews(data))
      .catch(() => alive && setReviews([]));
    return () => {
      alive = false;
    };
  }, [userId]);

  if (reviews === null) return <SkeletonRows rows={2} />;
  if (reviews.length === 0) return <EmptyState title="No reviews yet.">{name ? `${name}'s` : "Their"} reviews show up here after completed sessions.</EmptyState>;

  return (
    <Panel>
      <PanelHeader title={`Reviews · ${reviews.length}`} />
      <ul className="divide-y divide-line">
        {reviews.map((r) => (
          <li key={r._id} className="p-4 flex gap-3">
            <Avatar name={r.author?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm text-ink">
                  {r.author?.name} <span className="text-muted">· {r.role === "learner" ? "learned" : "taught"} “{r.booking?.listingSnapshot?.title}”</span>
                </p>
                <span className="font-mono text-xs">
                  {"★".repeat(r.rating)}
                  <span className="text-faint">{"★".repeat(5 - r.rating)}</span>
                </span>
              </div>
              {r.comment && <p className="mt-1 text-[15px] whitespace-pre-line">{r.comment}</p>}
              <p className="mt-1 font-mono text-2xs text-faint">{formatDate(r.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
};
