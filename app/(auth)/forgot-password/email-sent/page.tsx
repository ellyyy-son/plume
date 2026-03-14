export default function ForgotPasswordEmailSent() {
  return (
    <div className="bg-[#FBF5D1] px-10 pt-20 pb-15 border-5 border-[#E4DCAB] rounded-4xl justify-items-center translate-x-65 translate-y-15 shadow-xl/40">
      <h2 className="font-cherry text-[#2E2805] text-5xl pb-10">CHECK YOUR EMAIL</h2>
      <p className="font-delius text-lg text-[#2E2805] mb-8 text-center text-balance">
        We&apos;ve sent a password reset link to your email address.
        Please check your inbox (and spam folder) and follow the link to reset your password.
      </p>
      <p className="font-delius text-sm text-[#2E2805]">
        If you don&apos;t see the email right away, wait a few minutes and try again.
      </p>
    </div>
  );
}
