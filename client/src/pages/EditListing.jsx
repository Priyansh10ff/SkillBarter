import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { apiError } from "../lib/format";
import { Button, EmptyState, PageHeader, SkeletonRows } from "../components/ui";
import { ListingForm } from "../components/listings/ListingForm";

const EditListing = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/listings/${id}`)
      .then(({ data }) => setListing(data.listing))
      .catch((err) => setError(apiError(err, "Listing not found")));
  }, [id]);

  if (error) return <EmptyState title={error} action={<Button to="/profile">Your listings</Button>} />;
  if (!listing) return <SkeletonRows rows={3} />;
  if (listing.teacher._id !== user._id) {
    return <EmptyState title="You can only edit your own listings." action={<Button to={`/listings/${id}`}>Back to listing</Button>} />;
  }

  const save = async (values) => {
    await api.put(`/api/listings/${id}`, values);
    toast.success("Listing updated");
    navigate(`/listings/${id}`);
  };

  return (
    <>
      <PageHeader eyebrow="Teach" title="Edit listing" />
      <ListingForm
        initial={listing}
        submitLabel="Save changes"
        onSubmit={save}
        onCancel={() => navigate(`/listings/${id}`)}
        note="Changes apply to new bookings. Existing bookings keep the title, length and cost they were made with."
      />
    </>
  );
};

export default EditListing;
