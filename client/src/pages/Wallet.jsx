import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { apiError, formatDateTime } from "../lib/format";
import { Button, EmptyState, Hours, PageHeader, Panel, PanelHeader, SkeletonRows } from "../components/ui";
import { BalanceChart } from "../components/wallet/BalanceChart";
import { Stat, StatStrip } from "../components/profile/ProfileParts";

const DESCRIBE = {
  SIGNUP_BONUS: () => "Welcome credits",
  BOOKING_HOLD: (t) => `Held for ${t}`,
  REFUND: (t) => `Refund for ${t}`,
  SESSION_EARNING: (t) => `Earned from ${t}`,
  ADMIN_ADJUSTMENT: (t, note) => note || "Adjustment",
};

const Description = ({ entry }) => {
  const title = entry.booking?.listingSnapshot?.title;
  const text = DESCRIBE[entry.type]?.(title ? `“${title}”` : "a booking", entry.note) || entry.type;
  return entry.booking ? (
    <Link to={`/bookings#${entry.booking._id}`} className="hover:underline underline-offset-4">
      {text}
    </Link>
  ) : (
    text
  );
};

const Wallet = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [now] = useState(() => Date.now()); // right edge of the chart
  const balance = user.timeCredits;

  useEffect(() => {
    let alive = true;
    api
      .get("/api/wallet", { params: { limit: 20 } })
      .then(({ data: d }) => alive && setData(d))
      .catch((err) => toast.error(apiError(err, "Couldn't load your wallet")));
    return () => {
      alive = false;
    };
  }, [balance]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data: next } = await api.get("/api/wallet", { params: { limit: 20, page: data.page + 1 } });
      setData((d) => ({ ...next, history: d.history, entries: [...d.entries, ...next.entries] }));
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Credits" title="Wallet" description="Every hour in and out of your balance. 1 credit = 1 hour." />

      {!data ? (
        <SkeletonRows rows={4} />
      ) : (
        <div className="space-y-8">
          <StatStrip cols={3}>
            <Stat label="Available">
              <Hours value={data.balance} />
            </Stat>
            <Stat label="Held in bookings">
              <Hours value={data.held} tone="ink" />
            </Stat>
            <Stat label="Yours in total">
              <Hours value={data.balance + data.held} tone="ink" />
            </Stat>
          </StatStrip>

          <Panel>
            <PanelHeader title="Available balance over time" />
            <div className="p-4">
              {data.history.length > 1 ? (
                <BalanceChart points={data.history} current={data.balance} now={now} />
              ) : (
                <p className="text-muted py-8 text-center">The chart starts after your first booking or session.</p>
              )}
            </div>
          </Panel>

          <section aria-labelledby="statement-title">
            <h2 id="statement-title" className="text-lg mb-3">
              Statement
            </h2>
            {data.entries.length === 0 ? (
              <EmptyState title="No movements yet." />
            ) : (
              <div className="border border-line rounded overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="label-mono border-b border-line">
                    <tr>
                      <th scope="col" className="hidden sm:table-cell px-4 h-10 font-normal">When</th>
                      <th scope="col" className="px-4 h-10 font-normal">What</th>
                      <th scope="col" className="px-4 h-10 font-normal text-right">Amount</th>
                      <th scope="col" className="px-4 h-10 font-normal text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.entries.map((e) => (
                      <tr key={e._id} className="hover:bg-raised/40">
                        <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                        <td className="px-4 py-3 text-ink">
                          <Description entry={e} />
                          <span className="sm:hidden block mt-0.5 font-mono text-2xs text-faint">{formatDateTime(e.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Hours value={e.amount} signed tone="sign" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Hours value={e.balanceAfter} tone="ink" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.page < data.totalPages && (
              <div className="mt-4 flex justify-center">
                <Button onClick={loadMore} loading={loadingMore}>
                  Load older
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default Wallet;
