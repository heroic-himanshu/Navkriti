"use client";
import ThemeImage from "./ThemeImage";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { fetchWithProgress, postJSON } from "@/lib/fetchWithProgess";
import Link from "next/link";
const LoginFormHospital = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
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
        if (!formData.email || !formData.password) {
            setError("Please enter both Email and password");
            return;
        }
        setLoading(true);

        try {
            const response = await postJSON("/api/admin/auth/login", {
                email: formData.email,
                password: formData.password,
            }, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await response.json();

            if (data.success) {
                // Store token in localStorage
                localStorage.setItem("adminToken", data.token);

                // Store user data (optional)
                localStorage.setItem("adminData", JSON.stringify(data.user));

                // Redirect to dashboard
                router.push("/hospital/dashboard");
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
        <div className="form-container">
            <div className="left">
                <ThemeImage src={"/images/doctor-loginpage.png"} layout="fill" objectFit="contain" alt="doctor image" />
            </div>
            <div className="right">
                <h2>Hospital Login</h2>
                {error && (
                    <div
                        className="error-message"
                        style={{
                            padding: "10px",
                            marginBottom: "15px",
                            backgroundColor: "#fee",
                            color: "#c33",
                            borderRadius: "5px",
                            border: "1px solid #fcc",
                        }}
                    >
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
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
                <p style={{ marginTop: "15px", textAlign: "center" }}>
                    Don't have an account?{" "}
                    <Link href="/hospital/register" onClick={(e) => { e.preventDefault(); router.push("/hospital/register") }} style={{ color: "#007bff" }}>
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginFormHospital;
