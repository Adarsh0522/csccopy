import { PanFormContainer } from "@/components/pan-form/PanFormContainer";

export const metadata = {
  title: "New PAN Form | CSCCopy",
};

export default function NewPanPage() {
  return (
    <div className="w-full">
      <PanFormContainer noPadding />
    </div>
  );
}
