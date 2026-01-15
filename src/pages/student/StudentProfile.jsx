import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "@/services/user.service";

const STATUS_LABELS = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  BANNED: "Bị cấm",
};

const STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-700",
  BANNED: "border-red-200 bg-red-50 text-red-700",
};

export default function StudentProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const loadProfile = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
      setForm({
        fullName: data?.fullName || "",
        phone: data?.phone || "",
        dateOfBirth: data?.dateOfBirth || "",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể tải hồ sơ.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      errors.fullName = "Vui lòng nhập họ tên (tối thiểu 2 ký tự).";
    }
    if (form.phone && !/^[0-9]{10,11}$/.test(form.phone.trim())) {
      errors.phone = "Số điện thoại không hợp lệ.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth.trim() || undefined,
      };
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setIsEditing(false);
      setNotice({
        type: "success",
        message: "Cập nhật hồ sơ thành công!",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể cập nhật hồ sơ.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      dateOfBirth: profile?.dateOfBirth || "",
    });
    setFormErrors({});
    setNotice(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">
          Đang tải hồ sơ...
        </div>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[profile?.status] || profile?.status || "-";
  const statusStyle = STATUS_STYLES[profile?.status] || "";
  const roles = profile?.roles || [];
  const roleLabels = roles.map((role) => {
    if (role === "STUDENT") return "Học viên";
    if (role === "INSTRUCTOR" || role === "ROLE_INSTRUCTOR") return "Giáo viên";
    if (role === "ADMIN" || role === "ROLE_ADMIN") return "Quản trị viên";
    return role;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Hồ sơ của tôi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý thông tin cá nhân của bạn.
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition"
          >
            Chỉnh sửa
          </button>
        ) : null}
      </div>

      {notice ? (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        {!isEditing ? (
          <div className="divide-y divide-slate-200">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <span className="text-sm text-slate-900">{profile?.email || "-"}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700">Họ tên</span>
              <span className="text-sm text-slate-900">{profile?.fullName || "-"}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700">Số điện thoại</span>
              <span className="text-sm text-slate-900">{profile?.phone || "-"}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700">Ngày sinh</span>
              <span className="text-sm text-slate-900">
                {profile?.dateOfBirth || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700">Vai trò</span>
              <span className="text-sm text-slate-900">
                {roleLabels.join(", ") || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700">Trạng thái</span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle}`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700">
                Đăng nhập lần cuối
              </span>
              <span className="text-sm text-slate-900">
                {profile?.lastLoginAt || "-"}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500">
                Email không thể thay đổi.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => handleChange("fullName", event.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                placeholder="Nhập họ tên"
              />
              {formErrors.fullName ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.fullName}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                placeholder="Nhập số điện thoại"
              />
              {formErrors.phone ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  handleChange("dateOfBirth", event.target.value)
                }
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-10 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-[#E11D48] hover:bg-red-50 transition inline-flex items-center justify-center"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition inline-flex items-center justify-center disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
