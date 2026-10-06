import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { useBookListing } from "../hooks/useBookListing";
import { apiError, formatDate, formatDuration, timeIn } from "../lib/format";
import { Avatar, Button, EmptyState, Hours, Panel, SkeletonRows, Stamp } from "../components/ui";
import { ListingRow, ListingTableHead } from "../components/listings/ListingRow";

const TeacherCard = ({ teacher }) => {
  const now = teacher.timezone ? timeIn(teacher.timezone) : null;
  return (
    <div className="space-y-3">
      <Link to={`/u/${teacher._id}`} className="flex items-center gap-3 group">
        <Avatar name={teacher.name} />
        <div>
          <p className="text-ink group-hover:underline underline-offset-4">{teacher.name}</p>
          <p className="font-mono text-2xs text-faint">
            {teacher.stats?.classesTaught || 0} taught{teacher.ratingCount ? ` · ${teacher.rating.toFixed(1)} rating` : ""}
          </p>
        </div>
      </Link>
      {teacher.bio && <p className="text-sm text-muted line-clamp-4">{teacher.bio}</p>}
      {(teacher.preferredHours || now) && (
        <div className="font-mono text-xs space-y-1">
          {teacher.preferredHours && <p className="text-ink">{teacher.preferredHours}</p>}
          {now && (
            <p className="text-faint uppercase tracking-wider text-2xs">
              {teacher.timezone.replaceAll("_", " ")} · {now} there now
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { book, bookingId } = useBookListing();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/listings/${id}`)
      .then(({ data: d }) => alive && setData(d))
      .catch((err) => alive && setError(apiError(err, "Listing not found")));
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <EmptyState title={error} action={<Button to="/">Browse sessions</Button>}>
        It may have been removed by the teacher.
      </EmptyState>
    );
  }
  if (!data) return <SkeletonRows rows={3} />;

  const { listing, more } = data;
  const teacher = listing.teacher;
  const isOwn = user?._id === teacher._id;

  const remove = async () => {
    const ok = await confirm({
      title: "Remove this listing?",
      body: `“${listing.title}” stops showing up for learners. Existing bookings aren't affected.`,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/listings/${listing._id}`);
      toast.success("Listing removed");
      navigate("/profile");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          <nav aria-label="Breadcrumb" className="label-mono mb-4">
            <Link to="/" className="hover:text-ink">
              Browse
            </Link>{" "}
            / <span className="text-ink">{listing.category}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl leading-tight tracking-tightest">{listing.title}</h1>
          <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-faint">
            {formatDuration(listing.duration)} session · posted {formatDate(listing.createdAt)}
          </p>
          {listing.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {listing.tags.map((t) => (
                <Stamp key={t}>{t}</Stamp>
              ))}
            </div>
          )}
          <div className="mt-8 border-t border-line pt-6 max-w-prose whitespace-pre-line leading-relaxed text-[16px]">{listing.description}</div>
        </article>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <Panel className="p-4 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="label-mono">Cost</span>
              <Hours value={listing.creditCost} className="text-2xl" />
            </div>
            {isOwn ? (
              <div className="grid grid-cols-2 gap-2">
                <Button to={`/listings/${listing._id}/edit`}>Edit</Button>
                <Button variant="danger" onClick={remove}>
                  Remove
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="lg" className="w-full" loading={bookingId === listing._id} onClick={() => book(listing)}>
                {user ? "Book this session" : "Log in to book"}
              </Button>
            )}
            <p className="text-sm text-muted">
              {isOwn
                ? "This is your listing. Learners see the button to book it here."
                : "Credits are held when you book and only go to the teacher after you confirm the session happened."}
            </p>
          </Panel>
          <Panel className="p-4">
            <p className="label-mono mb-3">Teacher</p>
            <TeacherCard teacher={teacher} />
          </Panel>
        </aside>
      </div>

      {more.length > 0 && (
        <section>
          <h2 className="text-lg mb-3">More from {teacher.name.split(" ")[0]}</h2>
          <div className="border border-line rounded">
            <ListingTableHead />
            <ul className="divide-y divide-line">
              {more.map((l) => (
                <ListingRow key={l._id} listing={{ ...l, teacher }} isOwn={isOwn} onBook={book} booking={bookingId === l._id} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};

export default ListingDetail;
