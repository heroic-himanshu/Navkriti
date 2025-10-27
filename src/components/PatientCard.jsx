import Link from "next/link";
import React from "react";
import { Trash2 } from "lucide-react";
import { fetchWithProgress } from "@/lib/fetchWithProgess";
const PatientCard = (props) => {
  const {
    name,
    age,
    follow_up,
    condition,
    missed_doses,
    setRefresh,
    setAlert,
  } = props;
  const deletePatient = () => {
    document.querySelector(".delete-icon").style.cursor = "not-allowed";
    document.querySelector(".delete-icon").style.pointerEvents = "all !important";
    fetchWithProgress(`/api/admin/patients/${props.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.success)
          throw new Error(data.error || "Delete failed");
        setAlert({
          message: "Patient deleted successfully",
          color: "green",
        });
        setRefresh((prev) => !prev);
      })
      .catch((err) => {
        setAlert({
          message: err.message || "Error deleting patient",
          color: "red",
        });
      });

      document.querySelector(".delete-icon").style.cursor = "allowed";
      document.querySelector(".delete-icon").style.pointerEvents = "all !important";
  };

  return (
    <div className="patient-card">
      <div className="profile-content">
        <div>
          <i className={"fa-regular fa-user userIcon"}></i>
        </div>
        <div>
          <span className="delete-icon">
            <Trash2 color="#FF0000" onClick={deletePatient} />
          </span>
          <h2>{name}</h2>
          <p className="txt-light"> Age : {age}</p>
        </div>
      </div>
      <div className="details-content">
        <div>
          <p className="txt-light">Next Checkup :</p>
          <p>
            {new Date(follow_up).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="txt-light">Missed Doses :</p>
          <p className="missed-doses-text">{missed_doses}</p>
        </div>
        <div>
          <p className="txt-light">Condition :</p>
          <p>{condition}</p>
        </div>

        <Link
          href={`/hospital/patients/${props.id}`}
          className="view-profile-btn"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default PatientCard;
