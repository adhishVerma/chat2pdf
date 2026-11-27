// Sends email through Amazon SES. Without EMAIL_FROM set (local development),
// emails are printed to the server log instead.
import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

let client: SESv2Client | null = null;

function getClient() {
    client ??= new SESv2Client({
        region: process.env.SES_REGION || process.env.S3_REGION || "ap-south-1",
        // falls back to the instance role / default credential chain when unset
        ...(process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY ? {
            credentials: {
                accessKeyId: process.env.SES_ACCESS_KEY_ID,
                secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
            },
        } : {}),
    });
    return client;
}

export function appUrl(path: string) {
    const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
    return `${base}${path}`;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function sendEmail({ to, subject, text, linkLabel, link }: {
    to: string; subject: string; text: string; linkLabel: string; link: string;
}) {
    const from = process.env.EMAIL_FROM;
    const plain = `${text}\n\n${linkLabel}: ${link}\n`;
    if (!from) {
        console.log(`[email] EMAIL_FROM not set, not sending. To: ${to}\nSubject: ${subject}\n${plain}`);
        return;
    }
    const html = `<p>${escapeHtml(text)}</p><p><a href="${escapeHtml(link)}">${escapeHtml(linkLabel)}</a></p><p style="color:#666;font-size:12px">If the button doesn't work, paste this link into your browser:<br>${escapeHtml(link)}</p>`;
    await getClient().send(new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [to] },
        Content: {
            Simple: {
                Subject: { Data: subject },
                Body: { Text: { Data: plain }, Html: { Data: html } },
            },
        },
    }));
}

export async function sendVerificationEmail(to: string, token: string) {
    await sendEmail({
        to,
        subject: "Confirm your email for ChatPdf",
        text: "Thanks for signing up. Confirm your email address to start uploading PDFs. This link expires in 24 hours.",
        linkLabel: "Confirm email",
        link: appUrl(`/verify-email?token=${encodeURIComponent(token)}`),
    });
}

export async function sendPasswordResetEmail(to: string, token: string) {
    await sendEmail({
        to,
        subject: "Reset your ChatPdf password",
        text: "Someone asked to reset the password for this account. If it was you, use the link below within an hour. If not, you can ignore this email.",
        linkLabel: "Reset password",
        link: appUrl(`/reset-password?token=${encodeURIComponent(token)}`),
    });
}
