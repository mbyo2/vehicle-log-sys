import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/ModalContext";

export function ModalDemo() {
  const { openModal } = useModal();

  const handleOpenSimpleModal = () => {
    openModal({
      title: "Simple Modal",
      description: "This is a simple modal with just text content.",
      content: (
        <div className="py-4">
          <p>This is the modal content.</p>
        </div>
      ),
      size: "sm"
    });
  };

  const handleOpenFormModal = () => {
    openModal({
      title: "Form Modal",
      description: "This modal contains a form.",
      content: (
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Enter your name"
            />
          </div>
          <Button className="w-full">Submit</Button>
        </div>
      ),
      size: "md"
    });
  };

  return (
    <div className="space-x-4">
      <Button onClick={handleOpenSimpleModal}>Open Simple Modal</Button>
      <Button onClick={handleOpenFormModal}>Open Form Modal</Button>
    </div>
  );
}