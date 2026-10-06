import { useContext, useEffect, useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useBookListing } from "../hooks/useBookListing";
import { useDebounced } from "../hooks/useDebounced";
import { CATEGORIES } from "../lib/constants";
import { apiError } from "../lib/format";
import { Button, EmptyState, Hours, Input, PageHeader, Panel, PanelHeader, Select, SkeletonRows } from "../components/ui";
import { ListingRow, ListingTableHead } from "../components/listings/ListingRow";
import { BarterMatches } from "../components/listings/BarterMatches";

const PAGE_SIZE = 20;

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

const ListingList = ({ listings, user, book, bookingId }) => (
  <div className="border border-line rounded">
    <ListingTableHead />
    <ul className="divide-y divide-line">
      {listings.map((listing) => (
        <ListingRow key={listing._id} listing={listing} isOwn={user?._id === listing.teacher?._id} onBook={book} booking={bookingId === listing._id} />
      ))}
    </ul>
  </div>
);

// Barter matches + listings that teach what you want. Only for set-up accounts.
const ForYou = ({ user, book, bookingId }) => {
  const [data, setData] = useState({ matches: [], suggested: [] });
  const ready = Boolean(user?.onboardedAt);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    Promise.all([api.get("/api/users/matches"), api.get("/api/listings/suggested")])
      .then(([m, s]) => alive && setData({ matches: m.data, suggested: s.data.slice(0, 3) }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready, user?.skillsOffered, user?.skillsRequested]);

  if (!ready) return null;
  return (
    <>
      {data.matches.length > 0 && <BarterMatches matches={data.matches} />}
      {data.suggested.length > 0 && (
        <section aria-labelledby="suggested-title" className="mb-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 id="suggested-title" className="label-mono">
              Suggested for you
            </h2>
            <p className="text-sm text-muted">Matches what you want to learn: {user.skillsRequested.join(", ")}.</p>
          </div>
          <ListingList listings={data.suggested} user={user} book={book} bookingId={bookingId} />
        </section>
      )}
    </>
  );
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const { book, bookingId } = useBookListing();
  const [rawQuery, setRawQuery] = useState("");
  const [category, setCategory] = useState("All");
  const query = useDebounced(rawQuery.trim(), 250);
  const key = `${query}|${category}`;
  // results carry the key they were fetched for; a mismatch means loading
  const [results, setResults] = useState({ key: null, items: [], page: 1, totalPages: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);

  const params = (page) => ({ q: query || undefined, category: category === "All" ? undefined : category, page, limit: PAGE_SIZE });

  useEffect(() => {
    let alive = true;
    api
      .get("/api/listings", { params: { q: query || undefined, category: category === "All" ? undefined : category, page: 1, limit: PAGE_SIZE } })
      .then(({ data }) => alive && setResults({ key, ...data }))
      .catch(() => alive && setResults({ key, items: [], page: 1, totalPages: 1, total: 0 }));
    return () => {
      alive = false;
    };
  }, [key, query, category]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await api.get("/api/listings", { params: params(results.page + 1) });
      setResults((r) => ({ ...data, key: r.key, items: [...r.items, ...data.items] }));
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setLoadingMore(false);
    }
  };

  const loading = results.key !== key;
  const filtered = Boolean(query) || category !== "All";

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
          <p className="text-muted">Tell us what you teach and want to learn. It takes a minute and finds you people to swap with.</p>
          <Button size="sm" variant="primary" to="/welcome">
            Finish setting up
          </Button>
        </Panel>
      )}

      <ForYou user={user} book={book} bookingId={bookingId} />

      <section id="listings" aria-labelledby="all-title" className="scroll-mt-24">
        <h2 id="all-title" className="sr-only">
          All sessions
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <Input
              type="search"
              aria-label="Search sessions"
              placeholder="Search: react, guitar, interview prep…"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
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

        <div className="flex justify-between mb-2 label-mono" aria-live="polite">
          <span>{loading ? "Searching" : `${results.total} session${results.total === 1 ? "" : "s"}`}</span>
          <span>1 credit = 1 hour</span>
        </div>

        {loading ? (
          <SkeletonRows rows={5} />
        ) : results.items.length === 0 ? (
          <EmptyState
            title={filtered ? "Nothing matches that search." : "No sessions posted yet."}
            action={
              filtered ? (
                <Button
                  onClick={() => {
                    setRawQuery("");
                    setCategory("All");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button to={user ? "/create-listing" : "/register"}>{user ? "Post the first skill" : "Create an account to post one"}</Button>
              )
            }
          >
            {filtered ? "Try a broader word or another category." : "Post something you can teach and it shows up here."}
          </EmptyState>
        ) : (
          <>
            <ListingList listings={results.items} user={user} book={book} bookingId={bookingId} />
            {results.page < results.totalPages && (
              <div className="mt-4 flex justify-center">
                <Button onClick={loadMore} loading={loadingMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
};

export default Home;
