export default function EmailSent() {
  return (
    <div className="bg-[#FBF5D1] px-15 pt-20 pb-15 border-5 border-[#E4DCAB] rounded-4xl justify-items-center translate-x-75 translate-y-15 shadow-xl/40">
      <h2 className="font-cherry text-[#2E2805] text-7xl pb-10">Check Your Email</h2>
      <p className="font-delius text-lg text-[#2E2805] mb-8 text-center">
        We&apos;ve sent a verification link to your email address.
        Please verify your account to continue.
      </p>
      <p className="font-delius text-sm text-[#2E2805] mb-6">
        After clicking the link, you can sign in with your new credentials.
      </p>
    </div>
  );
}
