import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { apiError, formatDate, formatDuration } from "../lib/format";
import { Avatar, Button, EmptyState, Hours, Panel, PanelHeader, SkeletonRows, Stamp } from "../components/ui";
import { AvailabilityPanel, SkillsPanel, Stat, StatStrip } from "../components/profile/ProfileParts";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const confirm = useConfirm();
  const [listings, setListings] = useState(null);

  useEffect(() => {
    api
      .get("/api/listings/my")
      .then(({ data }) => setListings(data))
      .catch(() => setListings([]));
  }, []);

  const remove = async (listing) => {
    const ok = await confirm({
      title: "Remove this listing?",
      body: `“${listing.title}” stops showing up for learners. Existing bookings aren't affected.`,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/listings/${listing._id}`);
      setListings((prev) => prev.filter((l) => l._id !== listing._id));
      toast.success("Listing removed");
    } catch (error) {
      toast.error(apiError(error, "Couldn't remove it"));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl tracking-tightest truncate">{user.name}</h1>
          <p className="flex flex-wrap items-baseline gap-x-3 text-muted">
            <span>{user.email}</span>
            <span className="font-mono text-sm text-faint">joined {formatDate(user.createdAt)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" to={`/u/${user._id}`}>
            View public profile
          </Button>
          <Button size="sm" to="/settings">
            Edit profile
          </Button>
        </div>
      </header>

      {!user.onboardedAt && (
        <Panel className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">Add what you teach and want to learn so people can find you.</p>
          <Button size="sm" variant="primary" to="/welcome">
            Finish setting up
          </Button>
        </Panel>
      )}

      <StatStrip>
        <Stat label="Balance">
          <Hours value={user.timeCredits} />
        </Stat>
        <Stat label="Taught">{user.stats?.classesTaught || 0}</Stat>
        <Stat label="Attended">{user.stats?.classesAttended || 0}</Stat>
        <Stat label="Rating">{user.ratingCount ? user.rating.toFixed(1) : "—"}</Stat>
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
          <AvailabilityPanel
            preferredHours={user.preferredHours}
            timezone={user.timezone}
            action={
              <Button size="sm" variant="ghost" to="/settings">
                Edit
              </Button>
            }
          />
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">Your listings</h2>
          <Button size="sm" to="/create-listing">
            Post a skill
          </Button>
        </div>
        {listings === null ? (
          <SkeletonRows rows={2} />
        ) : listings.length === 0 ? (
          <EmptyState title="You haven't posted a skill." action={<Button to="/create-listing">Post one</Button>}>
            Post something you can teach to start earning hours.
          </EmptyState>
        ) : (
          <ul className="border border-line rounded divide-y divide-line">
            {listings.map((l) => (
              <li key={l._id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{l.title}</p>
                  <p className="font-mono text-2xs uppercase tracking-wider text-faint">
                    {l.category} · {formatDuration(l.duration)} · posted {formatDate(l.createdAt)}
                  </p>
                </div>
                <Hours value={l.creditCost} className="text-sm" />
                <Button size="sm" variant="ghost" onClick={() => remove(l)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Profile;
