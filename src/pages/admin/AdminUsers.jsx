import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listUsers,
  createUser,
  deleteUser,
} from "@/services/user.admin.service";

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

const ROLE_LABELS = {
  STUDENT: "Học viên",
  INSTRUCTOR: "Giáo viên",
  ROLE_INSTRUCTOR: "Giáo viên",
  ADMIN: "Quản trị viên",
  ROLE_ADMIN: "Quản trị viên",
};

const EMPTY_FORM = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  roles: [],
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRole = searchParams.get("role") || "STUDENT";

  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState({
    pageNumber: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 1,
  });
  const [usersLoading, setUsersLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [permissionError, setPermissionError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadUsers = async (pageNumber = 0, role = null) => {
    setUsersLoading(true);
    setNotice(null);
    setPermissionError(false);
    try {
      const data = await listUsers({
        role: role || activeRole,
        page: pageNumber,
        size: usersMeta.pageSize,
      });
      setUsers(data.items || []);
      setUsersMeta({
        pageNumber: data.pageNumber ?? pageNumber,
        pageSize: data.pageSize ?? usersMeta.pageSize,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 1,
      });
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setPermissionError(true);
      }
      setNotice({
        type: "error",
        message: error?.message || "Không thể tải danh sách người dùng.",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(0, activeRole);
  }, [activeRole]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      if (!term) return true;
      return (
        user.email?.toLowerCase().includes(term) ||
        user.fullName?.toLowerCase().includes(term) ||
        String(user.id).includes(term) ||
        user.phone?.toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  const handleRoleChange = (role) => {
    setSearchParams({ role });
  };

  const openCreateModal = () => {
    setModalType("create");
    setModalUser(null);
    setForm({
      ...EMPTY_FORM,
      roles: [activeRole],
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setModalType("delete");
    setModalUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalUser(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Email không hợp lệ.";
    }
    if (!form.password.trim() || form.password.trim().length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự.";
    }
    if (form.roles.length === 0) {
      errors.roles = "Vui lòng chọn ít nhất một vai trò.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    setNotice(null);
    if (!validateForm()) return;

    setSaving(true);
    try {
      await createUser({
        email: form.email.trim(),
        password: form.password.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        roles: form.roles,
      });
      setNotice({
        type: "success",
        message: "Tạo người dùng thành công!",
      });
      closeModal();
      loadUsers(usersMeta.pageNumber, activeRole);
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể tạo người dùng.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!modalUser) return;
    setActionLoadingId(modalUser.id);
    setNotice(null);
    try {
      await deleteUser(modalUser.id);
      setNotice({
        type: "success",
        message: `Đã xóa người dùng: ${modalUser.email}`,
      });
      closeModal();
      loadUsers(usersMeta.pageNumber, activeRole);
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể xóa người dùng.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (permissionError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Bạn không có quyền truy cập trang này.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý học viên và giáo viên trong hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition"
        >
          Thêm người dùng
        </button>
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

      <div className="mt-6 flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleRoleChange("STUDENT")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
            activeRole === "STUDENT"
              ? "border-[#E11D48] text-[#E11D48]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Học viên
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange("INSTRUCTOR")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
            activeRole === "INSTRUCTOR"
              ? "border-[#E11D48] text-[#E11D48]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Giáo viên
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo email, tên, ID..."
          className="h-10 min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        />
        <span className="text-sm text-slate-500">
          {filteredUsers.length} người dùng
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap">
                ID
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Họ tên
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Số điện thoại
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Đăng nhập lần cuối
              </th>
              <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-right font-semibold whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-slate-500">
                  Đang tải người dùng...
                </td>
              </tr>
            ) : filteredUsers.length ? (
              filteredUsers.map((user) => {
                const statusLabel = STATUS_LABELS[user.status] || user.status;
                const statusStyle = STATUS_STYLES[user.status] || "";
                const roles = user.roles || [];
                const roleLabels = roles
                  .map((role) => ROLE_LABELS[role] || role)
                  .join(", ");
                return (
                  <tr key={user.id} className="border-t hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-slate-700 whitespace-nowrap">
                      {user.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {user.fullName || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {user.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {roleLabels || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {user.lastLoginAt || "-"}
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDeleteModal(user)}
                        disabled={actionLoadingId === user.id}
                        className="text-[#E11D48] hover:text-[#BE123C] hover:underline underline-offset-4 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-slate-500">
                  Chưa có người dùng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => loadUsers(Math.max(usersMeta.pageNumber - 1, 0), activeRole)}
          disabled={usersMeta.pageNumber <= 0 || usersLoading}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
        >
          Trang trước
        </button>
        <span className="text-slate-500">
          Trang {usersMeta.pageNumber + 1} / {usersMeta.totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            loadUsers(
              Math.min(usersMeta.pageNumber + 1, usersMeta.totalPages - 1),
              activeRole
            )
          }
          disabled={
            usersMeta.totalPages <= usersMeta.pageNumber + 1 || usersLoading
          }
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
        >
          Trang sau
        </button>
      </div>

      {modalOpen && modalType === "create" ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeModal} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900">
              Thêm người dùng mới
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Tạo tài khoản {activeRole === "STUDENT" ? "học viên" : "giáo viên"} mới.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="example@email.com"
                />
                {formErrors.email ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="Tối thiểu 6 ký tự"
                />
                {formErrors.password ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
                ) : null}
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
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.roles.includes("STUDENT")}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          roles: checked
                            ? [...prev.roles, "STUDENT"]
                            : prev.roles.filter((r) => r !== "STUDENT"),
                        }));
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-[#E11D48] focus:ring-red-500/20"
                    />
                    <span className="text-sm text-slate-700">Học viên</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.roles.includes("INSTRUCTOR")}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          roles: checked
                            ? [...prev.roles, "INSTRUCTOR"]
                            : prev.roles.filter((r) => r !== "INSTRUCTOR"),
                        }));
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-[#E11D48] focus:ring-red-500/20"
                    />
                    <span className="text-sm text-slate-700">Giáo viên</span>
                  </label>
                </div>
                {formErrors.roles ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.roles}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-[#E11D48] hover:bg-red-50 transition inline-flex items-center justify-center"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={saving}
                className="h-10 rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition inline-flex items-center justify-center disabled:opacity-60"
              >
                {saving ? "Đang tạo..." : "Tạo người dùng"}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {modalOpen && modalType === "delete" && modalUser ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeModal} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Xác nhận xóa người dùng
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa người dùng này?
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
              <div>
                <span className="text-slate-500">Email:</span> {modalUser.email}
              </div>
              <div>
                <span className="text-slate-500">Họ tên:</span>{" "}
                {modalUser.fullName || "-"}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-[#E11D48] hover:bg-red-50 transition inline-flex items-center justify-center"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="h-10 rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition inline-flex items-center justify-center"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
