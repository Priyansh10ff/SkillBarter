import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { apiError, formatDate, formatDuration } from "../lib/format";
import { Avatar, Button, EmptyState, Hours, Input, Panel, PanelHeader, SkeletonRows, Stamp } from "../components/ui";

const Stat = ({ label, children }) => (
  <div className="bg-surface px-4 py-3">
    <p className="label-mono">{label}</p>
    <p className="mt-1 font-mono text-2xl tabular text-ink">{children}</p>
  </div>
);

const Availability = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user.preferredHours || "");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/api/users/profile", { preferredHours: value });
      await refreshUser();
      setEditing(false);
      toast.success("Availability saved");
    } catch (error) {
      toast.error(apiError(error, "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title="Usually free"
        action={
          !editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )
        }
      />
      <div className="p-4">
        {editing ? (
          <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row">
            <Input aria-label="Usually free" autoFocus maxLength={100} value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. Weekdays 18:00–21:00" />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={saving}>
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className={user.preferredHours ? "font-mono text-ink" : "text-muted"}>
            {user.preferredHours || "Not set. Tell learners when you're usually around."}
          </p>
        )}
      </div>
    </Panel>
  );
};

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

  const skills = [
    ["Teaches", user.skillsOffered],
    ["Wants to learn", user.skillsRequested],
  ];

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
      </header>

      <Panel className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line overflow-hidden">
        <Stat label="Balance">
          <Hours value={user.timeCredits} />
        </Stat>
        <Stat label="Taught">{user.stats?.classesTaught || 0}</Stat>
        <Stat label="Attended">{user.stats?.classesAttended || 0}</Stat>
        <Stat label="Rating">{user.ratingCount ? user.rating.toFixed(1) : "—"}</Stat>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel>
          <PanelHeader title="Skills" />
          <div className="p-4 space-y-4">
            {skills.map(([label, list]) => (
              <div key={label}>
                <p className="text-sm text-muted mb-2">{label}</p>
                {list?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((s) => (
                      <Stamp key={s}>{s}</Stamp>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-faint">Nothing added yet.</p>
                )}
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-6">
          <Availability />
          {user.badges?.length > 0 && (
            <Panel>
              <PanelHeader title="Badges" />
              <div className="p-4 flex flex-wrap gap-2">
                {user.badges.map((b) => (
                  <Stamp key={b.name} tone="accent">
                    {b.name}
                  </Stamp>
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
