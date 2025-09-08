import Image from "next/image";
import Navbar from "./components/navbar";

export default function page() {
  return (
    <main>
      <div className="min-h-screen bg-[#E9E9F4]">
        <Navbar />

        <div className="flex flex-row gap-x-2 px-60 mt-10 mb-20">
          <div className="flex flex-col p-6 w-[75%] text-black">
            <h1 className="text-6xl mb-5 font-bold">
              UniPLUS
            </h1>
            <div className="text-base text-balance">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, 
              when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap 
              into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem
            </div>
            <a href='#' className="w-fit mt-4 border-2 bg-black border-black text-white rounded-full px-4 py-2 inline-block font-semibold hover:bg-black hover:text-[#E9E9F4]">
              Browse
            </a>
          </div>
          <div>
            <Image src="/images/example.png" alt="group of student talking" width={600} height={280} className='rounded-2xl'/>
          </div>
        </div>
      </div>
    </main>
  );
}