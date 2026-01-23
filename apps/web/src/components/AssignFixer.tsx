import { useEffect, useMemo, useState } from "react";
import { Check, X, Search, Wrench } from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { cn } from "./ui/utils";

type UserStatus = "Active" | "Inactive";

interface Technician {
  id: string;
  name: string;
  specialty: string;
  status: UserStatus;
}

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationName: string;
  stationIssue?: string;
  technicians: Technician[];
  onAssign: (technicianIds: string[], notes: string) => Promise<void> | void;
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  stationName,
  stationIssue,
  technicians,
  onAssign,
}: AssignTechnicianDialogProps) {
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedTechnicians([]);
      setNotes("");
      setSubmitting(false);
      setKeyword("");
    }
  }, [open]);

  const isActive = (status: any) =>
    String(status || "").toLowerCase() === "active";

  const activeFixers = useMemo(() => {
    return (technicians || []).filter((t) => isActive(t.status));
  }, [technicians]);

  const filteredFixers = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return activeFixers;

    return activeFixers.filter((t) => {
      return (
        t.name.toLowerCase().includes(key) ||
        t.specialty.toLowerCase().includes(key)
      );
    });
  }, [activeFixers, keyword]);

  const selectedList = useMemo(() => {
    const map = new Map(activeFixers.map((t) => [t.id, t]));
    return selectedTechnicians
      .map((id) => map.get(id))
      .filter(Boolean) as Technician[];
  }, [selectedTechnicians, activeFixers]);

  const toggleTechnician = (id: string) => {
    setSelectedTechnicians((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearAll = () => setSelectedTechnicians([]);
  const selectAll = () => setSelectedTechnicians(activeFixers.map((t) => t.id));

  const allSelected =
    activeFixers.length > 0 &&
    selectedTechnicians.length === activeFixers.length;

  const handleAssign = async () => {
    if (selectedTechnicians.length === 0) return;

    try {
      setSubmitting(true);
      await onAssign(selectedTechnicians, notes);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Wrench className="size-5 text-white" />
              </div>

              <div>
                <DialogTitle className="text-base font-bold">
                  Phân công thợ sửa chữa
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Chọn thợ để xử lý sự cố nhanh chóng
                </DialogDescription>
              </div>
            </div>

            <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
              {selectedTechnicians.length} chọn
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Station info compact */}
          <div className="rounded-xl border bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Băng truyền</p>
            <p className="text-sm font-semibold text-gray-900">{stationName}</p>

            {stationIssue && (
              <p className="text-xs text-red-600 mt-1 line-clamp-2">
                ⚠ {stationIssue}
              </p>
            )}
          </div>

          {/* Search + actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Chọn kỹ thuật</Label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={selectAll}
                  disabled={
                    submitting || allSelected || activeFixers.length === 0
                  }
                >
                  Chọn tất cả
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={clearAll}
                  disabled={submitting || selectedTechnicians.length === 0}
                >
                  Bỏ chọn
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên / chuyên môn..."
                className="pl-9 h-10 rounded-xl"
                disabled={submitting || activeFixers.length === 0}
              />
            </div>
          </div>

          {/* List */}
          {activeFixers.length === 0 ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                Không có thợ hoạt động để phân công.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                <p className="text-xs text-gray-600">
                  Danh sách ({filteredFixers.length})
                </p>
                <p className="text-xs text-gray-600">
                  Active:{" "}
                  <span className="font-semibold">{activeFixers.length}</span>
                </p>
              </div>

              <div className="max-h-[220px] overflow-y-auto p-2 space-y-2">
                {filteredFixers.map((tech) => {
                  const checked = selectedTechnicians.includes(tech.id);

                  return (
                    <label
                      key={tech.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all",
                        checked
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white hover:bg-gray-50 border-gray-200",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleTechnician(tech.id)}
                          disabled={submitting}
                        />

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {tech.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {tech.specialty}
                          </p>
                        </div>
                      </div>

                      <Badge className="bg-green-600 hover:bg-green-600 shrink-0">
                        Active
                      </Badge>
                    </label>
                  );
                })}

                {filteredFixers.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-6">
                    Không tìm thấy kết quả
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected chips (gọn) */}
          <div className="min-h-[40px]">
            {selectedList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedList.map((t) => (
                  <Badge
                    key={t.id}
                    variant="secondary"
                    className="gap-2 px-2 py-1 rounded-full"
                  >
                    <span className="max-w-[160px] truncate">{t.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleTechnician(t.id)}
                      disabled={submitting}
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Chưa chọn thợ</p>
            )}
          </div>

          {/* Notes compact */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">
              Ghi chú (tuỳ chọn)
            </Label>
            <Textarea
              id="notes"
              placeholder="VD: ưu tiên xử lý gấp..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={submitting}
              className="rounded-xl"
            />
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Hủy
            </Button>

            <Button
              type="button"
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
              onClick={handleAssign}
              disabled={selectedTechnicians.length === 0 || submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang phân công...
                </div>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Phân công
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
