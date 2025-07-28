"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Loader2, Github } from "lucide-react";

interface CertInfo {
  success: boolean;
  url: string;
  host: string;
  path: string;
  certInfo: {
    connectionInfo: {
      protocol: string;
      cipher: string;
      authorized: boolean;
    };
    certificate: {
      subject: { CN: string };
      issuer: { CN: string };
      validFrom: string;
      validTo: string;
      daysRemaining: number;
    };
    certificateChain: Array<{
      subject: { CN: string };
      issuer: { CN: string };
      validFrom: string;
      validTo: string;
      isSelfSigned: boolean;
    }>;
    chainComplete: boolean;
  };
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [curlCommand, setCurlCommand] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    const command = `curl -s '${origin}/api/check-cert?url=${encodeURIComponent(
      url || "vercel.com",
    )}' | jq`;
    setCurlCommand(command);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const urlToCheck = url.startsWith("http") ? url : `https://${url}`;
      const response = await fetch(
        `/api/check-cert?url=${encodeURIComponent(urlToCheck)}`,
      );
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to check certificate");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 relative">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text bg-gradient-to-r from-white to-stone-400">
            Certificate Checker
          </h1>
          <p className="text-stone-400">
            Verify SSL/TLS certificates for any domain
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter domain or URL"
              className="flex-1 rounded-lg bg-stone-900 border border-stone-800 px-4 py-2 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="hover:cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Certificate"
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Certificate Information</h2>
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="text-sm text-stone-400 hover:text-white flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy JSON
                  </>
                )}
              </button>
            </div>

            <div className="bg-stone-900 rounded-lg border border-stone-800 p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-stone-400 mb-4">
                  Connection Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Protocol</p>
                    <p className="font-medium">
                      {result.certInfo.connectionInfo.protocol}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Authorized</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.certInfo.connectionInfo.authorized
                          ? "bg-green-900/50 text-green-300"
                          : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {result.certInfo.connectionInfo.authorized ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-stone-400 mb-4">
                  Certificate Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Subject</p>
                    <p className="font-medium">
                      {result.certInfo.certificate.subject.CN}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Issuer</p>
                    <p className="font-medium">
                      {result.certInfo.certificate.issuer.CN}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Valid From</p>
                    <p className="font-medium">
                      {result.certInfo.certificate.validFrom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Valid To</p>
                    <p className="font-medium">
                      {result.certInfo.certificate.validTo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Days Remaining</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.certInfo.certificate.daysRemaining > 30
                          ? "bg-green-900/50 text-green-300"
                          : result.certInfo.certificate.daysRemaining > 7
                            ? "bg-yellow-900/50 text-yellow-300"
                            : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {result.certInfo.certificate.daysRemaining} days
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex gap-4 justify-between">
                  <h3 className="text-sm font-medium text-stone-400 mb-4">
                    Certificate Chain
                  </h3>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.certInfo.chainComplete
                          ? "bg-green-900/50 text-green-300"
                          : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {result.certInfo.chainComplete
                        ? "Complete"
                        : "Incomplete"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.certInfo.certificateChain.map((cert, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-stone-800 pl-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-stone-500">Subject</p>
                          <p className="font-medium">{cert.subject.CN}</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Issuer</p>
                          <p className="font-medium">{cert.issuer.CN}</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Valid From</p>
                          <p className="font-medium">{cert.validFrom}</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Valid To</p>
                          <p className="font-medium">{cert.validTo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Self Signed</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              cert.isSelfSigned
                                ? "bg-yellow-900/50 text-yellow-300"
                                : "bg-green-900/50 text-green-300"
                            }`}
                          >
                            {cert.isSelfSigned ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 border-t border-stone-800 pt-8">
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={() => copyToClipboard(curlCommand)}
              className="hover:cursor-pointer text-sm text-stone-400 hover:text-white flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Command
                </>
              )}
            </button>
          </div>
          <div className="bg-stone-900 rounded-lg border border-stone-800 p-4">
            <code className="text-sm text-stone-300">{curlCommand}</code>
          </div>
        </div>
      </div>

      {/* GitHub link in bottom right corner */}
      <a
        href="https://github.com/vercel-support/cert-verify"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-full transition-colors duration-200"
        aria-label="View source on GitHub"
      >
        <Github className="w-5 h-5 text-stone-400 hover:text-white" />
      </a>
    </div>
  );
}
