import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import { PageHeader } from "../components/ui";
import { ListingForm } from "../components/listings/ListingForm";

const CreateListing = () => {
  const navigate = useNavigate();

  const create = async (values) => {
    const { data } = await api.post("/api/listings", values);
    toast.success("Skill posted");
    navigate(`/listings/${data._id}`);
  };

  return (
    <>
      <PageHeader eyebrow="Teach" title="Post a skill" description="One listing per thing you can teach. Learners book it, you agree on a time, and you earn the hours when the session is done." />
      <ListingForm submitLabel="Post skill" onSubmit={create} onCancel={() => navigate(-1)} />
    </>
  );
};

export default CreateListing;
