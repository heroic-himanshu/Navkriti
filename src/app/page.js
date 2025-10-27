import Card from "@/components/Card";
import Link from "next/link";
import React from "react";

const Index = () => {
  return (
    <div className="card-container">
      <Link href={"/patient/login"}>
        <Card
          iconClass="fa-heart"
          title="Patient Portal"
          description="Easy-to-use interface for managing your health medications and appointments."
          iconColor="blue"
          backgroundColor="rgb(235, 240, 250)"
        />
      </Link>
      <Link href={"/login"}>
        <Card
          iconClass="fa-hospital"
          title="Hospital Portal"
          description="Professional dashboard for managing patients, clients and opportunities."
          iconColor="red"
          backgroundColor="rgb(250, 235, 235)"
        />
      </Link>
    </div>
  );
};

export default Index;
