import { PhotoStudioContainer } from "@/components/photo-studio/PhotoStudioContainer";

export const metadata = {
  title: "Photo Studio | CSCCopy",
};

export default function PhotoStudioPage() {
  return (
    <div className="w-full flex-1 bg-slate-50 min-h-[calc(100vh-73px)]">
      <PhotoStudioContainer />
    </div>
  );
}
