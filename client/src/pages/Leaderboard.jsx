import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { Avatar, EmptyState, PageHeader, Segmented, SkeletonRows, Stamp } from "../components/ui";
import { Rating } from "../components/profile/ReviewList";

const BOARDS = [
  { value: "taught", label: "Most taught", description: "Members who have taught the most sessions." },
  { value: "rated", label: "Top rated", description: "Highest average rating, from members with at least 3 reviews." },
];

const Leaderboard = () => {
  const [sort, setSort] = useState("taught");
  const [result, setResult] = useState({ sort: null, leaders: [] });

  useEffect(() => {
    let alive = true;
    api
      .get("/api/users/leaderboard", { params: { sort } })
      .then(({ data }) => alive && setResult({ sort, leaders: data }))
      .catch(() => alive && setResult({ sort, leaders: [] }));
    return () => {
      alive = false;
    };
  }, [sort]);

  const board = BOARDS.find((b) => b.value === sort);
  const loading = result.sort !== sort;

  return (
    <>
      <PageHeader eyebrow="Community" title="Leaderboard" description={board.description} actions={<Segmented label="Leaderboard" options={BOARDS} value={sort} onChange={setSort} />} />

      {loading ? (
        <SkeletonRows rows={5} />
      ) : result.leaders.length === 0 ? (
        <EmptyState title={sort === "rated" ? "Nobody has 3 reviews yet." : "No completed sessions yet."}>
          {sort === "rated" ? "Members appear here once they have at least 3 reviews." : "The first person to teach a session takes the top spot."}
        </EmptyState>
      ) : (
        <div className="border border-line rounded overflow-x-auto">
          <table className="w-full text-left">
            <thead className="label-mono border-b border-line">
              <tr>
                <th scope="col" className="px-4 h-10 w-14 font-normal">#</th>
                <th scope="col" className="px-4 h-10 font-normal">Member</th>
                <th scope="col" className="px-4 h-10 font-normal text-right">Taught</th>
                <th scope="col" className="hidden sm:table-cell px-4 h-10 font-normal text-right">Learned</th>
                <th scope="col" className="px-4 h-10 font-normal text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.leaders.map((u, i) => (
                <tr key={u._id} className="hover:bg-raised/40">
                  <td className={`px-4 py-3 font-mono tabular ${i < 3 ? "text-ink" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-3">
                    <Link to={`/u/${u._id}`} className="flex items-center gap-3 group">
                      <Avatar name={u.name} size="sm" />
                      <span className="text-ink group-hover:underline underline-offset-4">{u.name}</span>
                      <span className="hidden md:flex gap-1.5">
                        {u.badges?.slice(-3).map((b) => (
                          <Stamp key={b.code || b.name}>{b.name}</Stamp>
                        ))}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">{u.stats?.classesTaught || 0}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-right font-mono tabular text-muted">{u.stats?.classesAttended || 0}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Rating value={u.rating} count={u.ratingCount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default Leaderboard;
