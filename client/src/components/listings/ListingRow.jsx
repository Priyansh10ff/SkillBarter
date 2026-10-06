import { Link } from "react-router-dom";
import { Avatar, Button, Hours, Stamp } from "../ui";
import { formatDuration } from "../../lib/format";

export const LISTING_GRID = "md:grid-cols-[minmax(0,1fr)_180px_110px_80px_88px]";

export const ListingTableHead = () => (
  <div className={`hidden md:grid ${LISTING_GRID} gap-x-6 px-4 h-10 items-center border-b border-line label-mono`}>
    <span>Session</span>
    <span>Teacher</span>
    <span>Category</span>
    <span className="text-right">Cost</span>
    <span />
  </div>
);

export const ListingRow = ({ listing, isOwn, onBook, booking }) => (
  <li className={`grid grid-cols-[minmax(0,1fr)_auto] ${LISTING_GRID} gap-x-6 gap-y-1 items-center px-4 py-4 hover:bg-raised/40 transition-colors`}>
    <div className="min-w-0">
      <h3 className="font-medium text-ink truncate">{listing.title}</h3>
      <p className="text-sm text-muted line-clamp-1">{listing.description}</p>
      <p className="mt-1.5 font-mono text-2xs uppercase tracking-wider text-faint md:hidden">
        {listing.teacher?.name} · {listing.category} · {formatDuration(listing.duration)}
      </p>
    </div>

    <Link to={`/u/${listing.teacher?._id}`} className="hidden md:flex items-center gap-2 min-w-0 group">
      <Avatar name={listing.teacher?.name} size="sm" />
      <span className="text-sm truncate group-hover:underline underline-offset-4">{listing.teacher?.name}</span>
    </Link>

    <span className="hidden md:block font-mono text-2xs uppercase tracking-wider text-muted">{listing.category}</span>

    <div className="row-span-2 md:row-span-1 flex flex-col items-end gap-2 md:contents">
      <Hours value={listing.creditCost} className="text-sm md:text-right" />
      <div className="md:text-right">
        {isOwn ? (
          <Stamp>Yours</Stamp>
        ) : (
          <Button size="sm" onClick={() => onBook(listing)} loading={booking} aria-label={`Book ${listing.title}`}>
            Book
          </Button>
        )}
      </div>
    </div>
  </li>
);
