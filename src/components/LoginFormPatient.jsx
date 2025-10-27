"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Image from "next/image";
// import { fetchWithProgress, postJSON } from "@/lib/fetchWithProgess";

const LoginFormPatient = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        ph_number: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user types
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validate input
        if (!formData.ph_number || !formData.password) {
            setError("Please enter both phone number and password");
            return;
        }

        if (formData.ph_number.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);

        try {
            const response = await postJSON("/api/auth/login", {
                ph_number: parseInt(formData.ph_number),
                password: formData.password,
            }, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (data.success) {
                // Store token in localStorage
                localStorage.setItem("patientToken", data.token);

                // Store user data (optional)
                localStorage.setItem("patientData", JSON.stringify(data.user));

                // Redirect to home
                router.push("/patient/home");
            } else {
                setError(data.error || "Login failed. Please try again.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container patient-login">
            <div className="left">
                <Image
                    src="/images/patient-loginpage.png"
                    fill={true}
                    alt="Patient Login"
                    priority
                    objectFit="contain"
                />
            </div>
            <div className="right">
                <h2>Patient Login</h2>

                {error && (
                    <div className="error-message" style={{
                        padding: "10px",
                        marginBottom: "15px",
                        backgroundColor: "#fee",
                        color: "#c33",
                        borderRadius: "5px",
                        border: "1px solid #fcc"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="ph_number"
                        placeholder="Enter your mobile number"
                        value={formData.ph_number}
                        onChange={handleChange}
                        disabled={loading}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                            background: loading ? "#ccc" : "#007bff",
                        }}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default LoginFormPatient;

