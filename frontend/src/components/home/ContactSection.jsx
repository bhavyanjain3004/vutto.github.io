import { CONTACT_DETAILS } from '@/data/contact';
export default function ContactSection() {
  return (
    <div className="py-8 text-center text-sm text-gray-500">
      Please contact us at {CONTACT_DETAILS.email} or {CONTACT_DETAILS.phone}.
    </div>
  );
}
