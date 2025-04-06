import HomeClient from "@/components/HomeClient";

const serverStatus = {
  status: "Online", // or "Offline"
  isOnline: true // or false
};

export default function Home() {
  return <HomeClient serverStatus={serverStatus} />;
}