"use client";

import { Loader2, Upload, X } from "lucide-react";
import { UserFormData, userSchema } from "@/lib/validations/user";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export default function UserModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }: Props) {
  // ✅ FIX: Removed <UserFormData> generic to let Zod infer the correct types (handling optional fields)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    // Use an empty string for password to satisfy Zod if it's optional during edit
    defaultValues: initialData || { name: '', email: '', password: '', roles: [] }
  });

  // Sync initialData when it changes (for editing)
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        password: '', // Don't pre-fill password for security/UI clarity
      });
    } else {
      reset({ name: '', email: '', password: '', roles: [] });
    }
  }, [initialData, reset, isOpen]);

  // ✅ FIX: Typed data as 'any' to prevent strict type mismatch during build
  const handleFormSubmit = (data: any) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    
    if (data.password) {
        formData.append("password", data.password);
    }
    
    if (data.roles) {
        data.roles.forEach((role: string) => formData.append("roles[]", role));
    }

    if (data.avatar?.[0]) {
      formData.append("avatar", data.avatar[0]);
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-gray-900">
          {initialData ? 'Update Member' : 'Add New Member'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-4">
              <label className="cursor-pointer group relative">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-indigo-500 group-hover:bg-indigo-50 transition-all overflow-hidden">
                   <Upload className="text-gray-400 group-hover:text-indigo-500" size={24} />
                </div>
                <input type="file" className="hidden" {...register("avatar")} accept="image/*" />
              </label>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Upload Avatar</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input 
              {...register("name")} 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
            <input 
              {...register("email")} 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Password {initialData && <span className="text-[10px] lowercase font-normal">(leave blank to keep current)</span>}
            </label>
            <input 
              type="password" 
              {...register("password")} 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
          </div>

          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center shadow-lg shadow-indigo-100 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}