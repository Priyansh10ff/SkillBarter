import { useEffect, useState } from "react";
import api from "../api/client";
import { Avatar, EmptyState, PageHeader, SkeletonRows, Stamp } from "../components/ui";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState(null);

  useEffect(() => {
    api
      .get("/api/users/leaderboard")
      .then(({ data }) => setLeaders(data))
      .catch(() => setLeaders([]));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Community" title="Leaderboard" description="Members who have taught the most sessions." />

      {leaders === null ? (
        <SkeletonRows rows={5} />
      ) : leaders.length === 0 ? (
        <EmptyState title="No completed sessions yet.">The first person to teach one takes the top spot.</EmptyState>
      ) : (
        <div className="border border-line rounded overflow-x-auto">
          <table className="w-full text-left">
            <thead className="label-mono border-b border-line">
              <tr>
                <th scope="col" className="px-4 h-10 w-14 font-normal">#</th>
                <th scope="col" className="px-4 h-10 font-normal">Member</th>
                <th scope="col" className="px-4 h-10 font-normal text-right">Taught</th>
                <th scope="col" className="px-4 h-10 font-normal text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leaders.map((u, i) => (
                <tr key={u._id} className="hover:bg-raised/40">
                  <td className={`px-4 py-3 font-mono tabular ${i === 0 ? "text-ink" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <span className="text-ink">{u.name}</span>
                      <span className="hidden sm:flex gap-1.5">
                        {u.badges?.map((b) => (
                          <Stamp key={b.name}>{b.name}</Stamp>
                        ))}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">{u.stats?.classesTaught || 0}</td>
                  <td className="px-4 py-3 text-right font-mono tabular text-muted">{u.ratingCount ? u.rating.toFixed(1) : "—"}</td>
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
