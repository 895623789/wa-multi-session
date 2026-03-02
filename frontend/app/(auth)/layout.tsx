export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] relative overflow-hidden">
            {/* Decorative Blob backgrounds */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-50 rounded-full blur-[100px] opacity-60"></div>

            <div className="w-full relative z-10">
                {children}
            </div>
        </div>
    );
}
