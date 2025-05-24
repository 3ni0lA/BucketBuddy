import { Navbar } from "@/components/Navbar";
import { BucketList } from "@/components/BucketList";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <BucketList />
      <Footer />
    </div>
  );
}
