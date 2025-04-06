import HomeClient from "@/components/Hero/Hero";

const serverStatus = {
  status: "Online", // or "Offline"
  isOnline: true // or false
};

export default function Home() {
  return <HomeClient serverStatus={serverStatus} />;
}