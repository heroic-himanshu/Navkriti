import React, { useState } from "react";
import { usePatients } from "@/store/patientStore";
import {
  Monitor,
  Users,
  AlertCircle,
  Calendar,
  Plus,
  User,
  Phone,
  Lock,
  MapPin,
  Stethoscope,
  UserPlus,
  Pill,
  Trash2,
  X,
} from "lucide-react";
import { postJSON } from "@/lib/fetchWithProgess";

export default function PatientRegister() {
  const { setRefreshAlerts } = usePatients();
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    name: "",
    ph_number: "",
    password: "",
    sex: "M",
    age: "",
    address: "",
    dept: "",
    doctor_name: "",
    problem: "",
    followup: "",
    alert_type: "Low",
  });

  const [medicines, setMedicines] = useState([
    {
      name: "",
      color: "white",
      dosage: "1 tablet",
      frequency: "Once daily",
      acceptedtime: "",
      duration_days: 7,
      instructions: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index][field] = value;
    setMedicines(updatedMedicines);
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        color: "white",
        dosage: "1 tablet",
        frequency: "Once daily",
        acceptedtime: "",
        duration_days: 7,
        instructions: "",
      },
    ]);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) {
      const updatedMedicines = medicines.filter((_, i) => i !== index);
      setMedicines(updatedMedicines);
    }
  };

  const handleSubmit = async () => {
    setMessage({ type: "", text: "" });

    if (
      !formData.name ||
      !formData.ph_number ||
      !formData.age ||
      !formData.password
    ) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    if (formData.ph_number.length !== 10) {
      setMessage({ type: "error", text: "Phone number must be 10 digits" });
      return;
    }

    const validMedicines = medicines.filter((m) => m.name && m.acceptedtime);

    setLoading(true);

    try {
      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("patientToken");

      const patientResponse = await postJSON(
        "/api/admin/patients",
        {
          name: formData.name,
          ph_number: parseInt(formData.ph_number),
          sex: formData.sex,
          age: parseInt(formData.age),
          address: formData.address,
          password: formData.password,
        },
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const patientData = await patientResponse.json();

      if (!patientData.success) {
        setMessage({
          type: "error",
          text: patientData.error || "Failed to create patient",
        });
        setLoading(false);
        return;
      }
      setRefreshAlerts((prev) => !prev);
      const patientId = patientData.data._id;

      if (validMedicines.length > 0 && formData.dept) {
        const medicineResponse = await postJSON(
          `/api/admin/patients/${patientId}/add-medicine`,
          {
            dept: formData.dept,
            doctor_name: formData.doctor_name,
            problem: formData.problem,
            followup: formData.followup || null,
            alert_type: formData.alert_type.toLowerCase(),
            prescription: validMedicines.map((m) => ({
              ...m,
              start_date: new Date(), // optional
              is_active: true,
            })),
          },
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const medicineData = await medicineResponse.json();

        if (!medicineData.success) {
          setMessage({
            type: "warning",
            text: `Patient created but failed to add medicines: ${medicineData.error}`,
          });
          setLoading(false);
          return;
        }
      }

      setMessage({ type: "success", text: "Patient added successfully!" });

      // Reset form
      setFormData({
        name: "",
        ph_number: "",
        password: "",
        sex: "M",
        age: "",
        address: "",
        dept: "",
        doctor_name: "",
        problem: "",
        followup: "",
        alert_type: "Low",
      });
      setMedicines([
        {
          name: "",
          color: "white",
          dosage: "1 tablet",
          frequency: "Once daily",
          acceptedtime: "",
          duration_days: 7,
          instructions: "",
        },
      ]);
      setActiveTab("basic");
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-register-wrapper">
      <div className="patient-register-container">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Patient Register
        </h1>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : message.type === "warning"
                ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">
                {message.type === "success"
                  ? "Success"
                  : message.type === "warning"
                  ? "Warning"
                  : "Error"}
              </p>
              <p className="text-sm">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-6 py-3 font-medium transition rounded-t-lg ${
              activeTab === "basic"
                ? "tab-button-active"
                : "tab-button-inactive"
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab("medical")}
            className={`px-6 py-3 font-medium transition rounded-t-lg ${
              activeTab === "medical"
                ? "tab-button-active"
                : "tab-button-inactive"
            }`}
          >
            Medical Info
          </button>
          <button
            onClick={() => setActiveTab("medicines")}
            className={`px-6 py-3 font-medium transition rounded-t-lg ${
              activeTab === "medicines"
                ? "tab-button-active"
                : "tab-button-inactive"
            }`}
          >
            Medicines
          </button>
        </div>

        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div className="bg-1e293b rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="Enter patient name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="ph_number"
                    value={formData.ph_number}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="Enter patient mobile number"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4" />
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <UserPlus className="w-4 h-4" />
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="Enter age"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Sex <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="N">Other</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveTab("medical")}
                className="w-full nav-button-primary"
              >
                Next: Medical Info →
              </button>
            </div>
          </div>
        )}

        {/* Medical Info Tab */}
        {activeTab === "medical" && (
          <div className="bg-1e293b rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Stethoscope className="w-4 h-4" />
                    Department
                  </label>
                  <input
                    type="text"
                    name="dept"
                    value={formData.dept}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="e.g., Cardiology"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    name="doctor_name"
                    value={formData.doctor_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="Dr. Name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Problem/Diagnosis
                  </label>
                  <input
                    type="text"
                    name="problem"
                    value={formData.problem}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                    placeholder="Diagnosis"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    name="followup"
                    value={formData.followup}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Alert Type
                  </label>
                  <select
                    name="alert_type"
                    value={formData.alert_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("basic")}
                  className="flex-1 nav-button-secondary"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setActiveTab("medicines")}
                  className="flex-1 nav-button-primary"
                >
                  Next: Medicines →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === "medicines" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Prescription Details
              </h3>
              <button
                onClick={addMedicine}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition add-medicine-button hover-cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            {medicines.map((medicine, index) => (
              <div
                key={index}
                className="bg-1e293b rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    Medicine {index + 1}
                  </h4>
                  {medicines.length > 1 && (
                    <button
                      onClick={() => removeMedicine(index)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="w-5 h-5 text-red-800 hover-cursor-pointer" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicine.name}
                      onChange={(e) =>
                        handleMedicineChange(index, "name", e.target.value)
                      }
                      className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                      placeholder="e.g., Paracetamol 650mg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Color
                    </label>
                    <select
                      value={medicine.color}
                      onChange={(e) =>
                        handleMedicineChange(index, "color", e.target.value)
                      }
                      className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition bg-white"
                    >
                      <option value="white">White</option>
                      <option value="yellow">Yellow</option>
                      <option value="orange">Orange</option>
                      <option value="pink">Pink</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="red">Red</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) =>
                        handleMedicineChange(index, "dosage", e.target.value)
                      }
                      className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                      placeholder="1 tablet"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Frequency
                    </label>
                    <select
                      value={medicine.frequency}
                      onChange={(e) =>
                        handleMedicineChange(index, "frequency", e.target.value)
                      }
                      className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition bg-white"
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="3 times daily">3 times daily</option>
                      <option value="4 times daily">4 times daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Time Schedule <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicine.acceptedtime}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "acceptedtime",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                      placeholder="8-10, 14-16, 20-22"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: 8-10, 14-16, 20-22
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={medicine.duration_days}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "duration_days",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                      placeholder="7"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Instructions
                    </label>
                    <textarea
                      value={medicine.instructions}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "instructions",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition"
                      placeholder="Take after meals"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab("medical")}
                className="flex-1 nav-button-secondary"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 nav-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding Patient..." : "Add Patient"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
