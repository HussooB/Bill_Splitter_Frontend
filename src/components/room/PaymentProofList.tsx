import { useEffect, useState, ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";

interface PaymentProof {
  id: number;
  sender: string;
  fileUrl: string;
  createdAt: string;
}

interface BackendProof {
  id: number;
  url: string;
  roomId: number;
  userId: number;
  createdAt: string;
  user?: { name: string };
}

interface PaymentProofListProps {
  roomId: number;
}

const PaymentProofList: React.FC<PaymentProofListProps> = ({ roomId }) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);

  // ✅ Fetch proofs from backend
  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token) {
          toast({ title: "Unauthorized", description: "Please log in." });
          return;
        }

        const res = await fetch(`${API_URL}/proofs/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch payment proofs");
        const data = await res.json();

        const formatted: PaymentProof[] = data.proofs.map(
          (proof: BackendProof) => ({
            id: proof.id,
            sender: proof.user?.name || `User ${proof.userId}`,
            fileUrl: proof.url,
            createdAt: new Date(proof.createdAt).toLocaleDateString(),
          })
        );

        setProofs(formatted);
      } catch (error: any) {
        console.error("Error fetching proofs:", error);
        toast({
          title: "Error loading proofs",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchProofs();
  }, [roomId, toast]);

  // ✅ Handle proof upload
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token) {
        toast({ title: "Unauthorized", description: "Please log in." });
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/proofs/${roomId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload proof");
      const data = await res.json();

      // Append the new proof to the list
      const newProof: PaymentProof = {
        id: data.proof.id,
        sender: "You",
        fileUrl: data.proof.url,
        createdAt: new Date(data.proof.createdAt).toLocaleDateString(),
      };

      setProofs((prev) => [...prev, newProof]);

      toast({
        title: "Payment proof uploaded",
        description: "Your payment proof has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Payment Proof</h2>
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Input
              id="proof-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Label htmlFor="proof-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isUploading
                  ? "Uploading..."
                  : "Click to upload payment screenshot"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 10MB
              </p>
            </Label>
          </div>
        </div>
      </Card>

      {/* Proof List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Proofs</h2>
        <div className="space-y-4">
          {proofs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payment proofs uploaded yet
            </p>
          ) : (
            proofs.map((proof) => (
              <div
                key={proof.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="h-16 w-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                  <img
                    src={proof.fileUrl}
                    alt="proof"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{proof.sender}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {proof.createdAt}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(proof.fileUrl, "_blank")}
                >
                  View
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentProofList;
