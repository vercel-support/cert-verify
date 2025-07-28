import { NextResponse } from "next/server";
import https from "https";
import tls from "tls";
import crypto from "crypto";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Define interfaces for our certificate info structure
interface CertificateInfo {
  connectionInfo: {
    protocol: string | null;
    cipher: string;
    authorized: boolean;
  };
  certificate: {
    subject: tls.PeerCertificate["subject"];
    issuer: tls.PeerCertificate["issuer"];
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    serialNumber: string;
    fingerprint: string;
  };
  certificateChain: {
    subject: tls.PeerCertificate["subject"];
    issuer: tls.PeerCertificate["issuer"];
    validFrom: string;
    validTo: string;
    isSelfSigned: boolean;
  }[];
  chainComplete: boolean;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    const errorResponse = {
      success: false,
      error:
        "URL parameter is required. Example: /api/check-cert?url=example.com",
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  try {
    const parsedUrl = new URL(
      targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
    );
    const certInfo = await checkCertificate(
      parsedUrl.hostname,
      parsedUrl.pathname,
      url.searchParams.get("timeout")
        ? parseFloat(url.searchParams.get("timeout")!)
        : undefined,
    );

    const response = {
      success: true,
      url: targetUrl,
      host: parsedUrl.hostname,
      path: parsedUrl.pathname,
      certInfo,
    };

    // Log the successful response
    console.log(
      "Certificate Check API Response:",
      JSON.stringify(response, null, 2),
    );

    return NextResponse.json(response);
  } catch (error) {
    const errorResponse = {
      success: false,
      url: targetUrl,
      error: error instanceof Error ? error.message : String(error),
    };

    // Log the error response
    console.error(
      "Certificate Check API Error:",
      JSON.stringify(errorResponse, null, 2),
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

async function checkCertificate(
  host: string,
  path: string,
  timeoutSeconds?: number,
): Promise<CertificateInfo> {
  return new Promise((resolve, reject) => {
    const timeout = timeoutSeconds ? timeoutSeconds * 1000 : 5000;
    const options = {
      host,
      port: 443,
      path,
      method: "HEAD",
      rejectUnauthorized: true,
      timeout,
      // force new session for each request
      secureOptions:
        crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION,
      agent: new https.Agent({ maxCachedSessions: 0 }),
    };

    const req = https.request(options, (res) => {
      const tlsSocket = res.socket as tls.TLSSocket;

      if (!tlsSocket.authorized) {
        reject(
          new Error(
            `Certificate validation failed: ${tlsSocket.authorizationError}`,
          ),
        );
        return;
      }

      const cert = tlsSocket.getPeerCertificate(true);
      const validTo = new Date(cert.valid_to);
      const daysRemaining = Math.floor(
        (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      const certInfo: CertificateInfo = {
        connectionInfo: {
          protocol: tlsSocket.getProtocol(),
          cipher: tlsSocket.getCipher()
            ? `${tlsSocket.getCipher()!.name} (${
                tlsSocket.getCipher()!.version
              })`
            : "Unknown",
          authorized: tlsSocket.authorized,
        },
        certificate: {
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysRemaining,
          serialNumber: cert.serialNumber,
          fingerprint: cert.fingerprint,
        },
        certificateChain: getCertificateChain(cert),
        chainComplete: isChainComplete(cert),
      };

      resolve(certInfo);
    });

    const timeoutId = setTimeout(() => {
      req.destroy();
      reject(
        new Error(
          `Connection timed out after ${
            timeout / 1000
          } seconds while trying to connect to ${host}`,
        ),
      );
    }, timeout);

    req.on("error", (error) => {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        reject(
          error.message.includes("timeout") || error.message.includes("connect")
            ? new Error(
                `Failed to connect to ${host}: ${
                  error.message.includes("timeout")
                    ? `Connection timed out after ${timeout / 1000} seconds`
                    : "Server might be unreachable or behind a firewall"
                }`,
              )
            : error,
        );
      } else {
        reject(error);
      }
    });

    req.end();
  });
}

function getCertificateChain(cert: tls.DetailedPeerCertificate) {
  const chain = [];
  let current = cert;

  while (current && Object.keys(current).length > 0) {
    const isSelfSigned =
      JSON.stringify(current.subject) === JSON.stringify(current.issuer);
    chain.push({
      subject: current.subject,
      issuer: current.issuer,
      validFrom: current.valid_from,
      validTo: current.valid_to,
      isSelfSigned,
    });

    current = current.issuerCertificate;
    if (chain.length > 10 || isSelfSigned) break;
  }

  return chain;
}

function isChainComplete(cert: tls.DetailedPeerCertificate): boolean {
  let current = cert;
  while (current && Object.keys(current).length > 0) {
    if (JSON.stringify(current.subject) === JSON.stringify(current.issuer)) {
      return true;
    }
    current = current.issuerCertificate;
  }
  return false;
}
