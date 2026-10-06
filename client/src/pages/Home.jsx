import { useContext, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useBookListing } from "../hooks/useBookListing";
import { CATEGORIES } from "../lib/constants";
import { Button, EmptyState, Hours, Input, PageHeader, Panel, PanelHeader, Select, SkeletonRows } from "../components/ui";
import { ListingRow, ListingTableHead } from "../components/listings/ListingRow";

const LEDGER_EXAMPLE = [
  ["welcome credits", 2],
  ["you teach react · 1 h", 1],
  ["you learn guitar · 1 h", -1],
  ["you learn figma · 30 min", -0.5],
];

const Intro = () => (
  <section className="grid gap-10 md:grid-cols-[1.25fr_1fr] md:items-end border-b border-line pb-12 mb-10">
    <div>
      <p className="label-mono mb-5">Time bank for skills</p>
      <h1 className="text-[44px] md:text-6xl leading-[1.02] tracking-tightest">
        Teach an hour.
        <br />
        Learn an hour.
      </h1>
      <p className="mt-6 text-muted text-lg max-w-md">
        Post what you know, book what you want to learn. Every hour costs one credit, whatever the subject. New members start with{" "}
        <Hours value={2} />.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="primary" size="lg" to="/register">
          Create an account
        </Button>
        <Button size="lg" onClick={() => document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" })}>
          Browse sessions
        </Button>
      </div>
    </div>

    <Panel>
      <PanelHeader title="How the maths works" />
      <dl className="font-mono text-sm tabular p-4 space-y-2">
        {LEDGER_EXAMPLE.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd>
              <Hours value={value} signed tone="sign" />
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-line pt-2">
          <dt className="text-ink">balance</dt>
          <dd>
            <Hours value={LEDGER_EXAMPLE.reduce((sum, [, v]) => sum + v, 0)} />
          </dd>
        </div>
      </dl>
    </Panel>
  </section>
);

const Home = () => {
  const { user } = useContext(AuthContext);
  const { book, bookingId } = useBookListing();
  const [listings, setListings] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let alive = true;
    api
      .get("/api/listings")
      .then(({ data }) => alive && setListings(data))
      .catch(() => alive && setListings([]));
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (listings || []).filter(
      (l) =>
        (category === "All" || l.category === category) &&
        (!q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
    );
  }, [listings, query, category]);

  return (
    <>
      {user ? (
        <PageHeader
          eyebrow="Browse"
          title="What do you want to learn?"
          description={
            <>
              You have <Hours value={user.timeCredits} /> to spend. Teaching earns it back, hour for hour.
            </>
          }
          actions={
            // the nav has this button on desktop
            <Button to="/create-listing" variant="primary" className="md:hidden">
              Post a skill
            </Button>
          }
        />
      ) : (
        <Intro />
      )}

      {user && !user.onboardedAt && (
        <Panel className="mb-8 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">Tell us what you teach and want to learn. It takes a minute and helps people find you.</p>
          <Button size="sm" variant="primary" to="/welcome">
            Finish setting up
          </Button>
        </Panel>
      )}

      <section id="listings" aria-label="Sessions" className="scroll-mt-24">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <Input
              type="search"
              aria-label="Search sessions"
              placeholder="Search: react, guitar, interview prep…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-44">
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div className="flex justify-between mb-2 label-mono">
          <span>{listings ? `${visible.length} session${visible.length === 1 ? "" : "s"}` : "Loading"}</span>
          <span>1 credit = 1 hour</span>
        </div>

        {listings === null ? (
          <SkeletonRows rows={5} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={listings.length === 0 ? "No sessions posted yet." : "Nothing matches that search."}
            action={
              user ? (
                <Button to="/create-listing">Post the first skill</Button>
              ) : listings.length === 0 ? (
                <Button to="/register">Create an account to post one</Button>
              ) : null
            }
          >
            {listings.length === 0 ? "Post something you can teach and it shows up here." : "Try a broader word or another category."}
          </EmptyState>
        ) : (
          <div className="border border-line rounded">
            <ListingTableHead />
            <ul className="divide-y divide-line">
              {visible.map((listing) => (
                <ListingRow
                  key={listing._id}
                  listing={listing}
                  isOwn={user?._id === listing.teacher?._id}
                  onBook={book}
                  booking={bookingId === listing._id}
                />
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
};

export default Home;
