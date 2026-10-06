import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useBookListing } from "../hooks/useBookListing";
import { apiError, formatDate } from "../lib/format";
import { Avatar, Button, EmptyState, Panel, PanelHeader, SkeletonRows, Stamp } from "../components/ui";
import { ListingRow, ListingTableHead } from "../components/listings/ListingRow";
import { AvailabilityPanel, SkillsPanel, Stat, StatStrip } from "../components/profile/ProfileParts";
import { ReviewList } from "../components/profile/ReviewList";

const PublicProfile = () => {
  const { id } = useParams();
  const { user: me } = useContext(AuthContext);
  const { book, bookingId } = useBookListing();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/users/${id}`)
      .then(({ data: d }) => alive && setData(d))
      .catch((err) => alive && setError(apiError(err, "Member not found")));
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <EmptyState title={error} action={<Button to="/">Browse sessions</Button>}>
        The link may be wrong, or the account isn't verified yet.
      </EmptyState>
    );
  }
  if (!data) return <SkeletonRows rows={3} />;

  const { user, listings } = data;
  const isMe = me?._id === user._id;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl tracking-tightest truncate">{user.name}</h1>
          <p className="font-mono text-sm text-faint">member since {formatDate(user.createdAt)}</p>
        </div>
        {isMe && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">This is how others see you.</span>
            <Button size="sm" to="/settings">
              Edit
            </Button>
          </div>
        )}
      </header>

      <StatStrip>
        <Stat label="Taught">{user.stats?.classesTaught || 0}</Stat>
        <Stat label="Attended">{user.stats?.classesAttended || 0}</Stat>
        <Stat label="Rating">{user.ratingCount ? user.rating.toFixed(1) : "—"}</Stat>
        <Stat label="Reviews">{user.ratingCount || 0}</Stat>
      </StatStrip>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          {user.bio && (
            <Panel>
              <PanelHeader title="About" />
              <p className="p-4 whitespace-pre-line">{user.bio}</p>
            </Panel>
          )}
          <SkillsPanel offered={user.skillsOffered} requested={user.skillsRequested} />
        </div>
        <div className="space-y-6">
          <AvailabilityPanel preferredHours={user.preferredHours} timezone={user.timezone} />
          {user.badges?.length > 0 && (
            <Panel>
              <PanelHeader title="Badges" />
              <div className="p-4 flex flex-wrap gap-2">
                {user.badges.map((b) => (
                  <Stamp key={b.name}>{b.name}</Stamp>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-lg mb-3">What people say</h2>
        <ReviewList userId={user._id} name={user.name.split(" ")[0]} />
      </section>

      <section>
        <h2 className="text-lg mb-3">Sessions by {user.name.split(" ")[0]}</h2>
        {listings.length === 0 ? (
          <EmptyState title="No sessions posted yet." />
        ) : (
          <div className="border border-line rounded">
            <ListingTableHead />
            <ul className="divide-y divide-line">
              {listings.map((l) => (
                <ListingRow key={l._id} listing={{ ...l, teacher: user }} isOwn={isMe} onBook={book} booking={bookingId === l._id} />
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicProfile;
