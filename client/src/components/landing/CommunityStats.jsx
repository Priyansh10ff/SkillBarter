import { useEffect, useState } from "react";
import api from "../../api/client";
import { Hours } from "../ui";
import { Stat, StatStrip } from "../profile/ProfileParts";

// Real numbers only; hidden until there's at least one completed session
export const CommunityStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .get("/api/stats")
      .then(({ data }) => alive && setStats(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!stats?.sessionsCompleted) return null;
  return (
    <section aria-label="Community numbers" className="mb-12">
      <StatStrip>
        <Stat label="Members">{stats.members}</Stat>
        <Stat label="Sessions done">{stats.sessionsCompleted}</Stat>
        <Stat label="Hours traded">
          <Hours value={stats.hoursExchanged} />
        </Stat>
        <Stat label="Open sessions">{stats.openListings}</Stat>
      </StatStrip>
    </section>
  );
};
