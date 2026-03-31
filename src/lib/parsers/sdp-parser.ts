import { SdpInfo } from "../types";

export function parseSdp(content: string, fileName: string): SdpInfo {
  const getLine = (prefix: string): string => {
    const line = content.split("\n").find((l) => l.startsWith(prefix));
    return line?.substring(prefix.length).trim() ?? "";
  };

  const getAttr = (attr: string): string => {
    const line = content.split("\n").find((l) => l.startsWith(`a=${attr}:`));
    return line?.substring(`a=${attr}:`.length).trim() ?? "";
  };

  // Extract role and IDs from filename
  // e.g. participant-pac_3677203_UUID-UUID.sdp
  const nameMatch = fileName.match(
    /participant-(pac|prof)[_](.+?)[\-]([a-f0-9\-]{36})/,
  );
  const role = nameMatch?.[1] ?? "unknown";
  const roomId = nameMatch?.[3] ?? "";

  // Media line: m=audio 40246 RTP/AVP 100
  const mediaLine = getLine("m=");
  const mediaParts = mediaLine.split(/\s+/);
  const rtpPort = parseInt(mediaParts[1]) || 0;

  // RTCP port
  const rtcpPort = parseInt(getAttr("rtcp")) || 0;

  // Codec: a=rtpmap:100 opus/48000/2
  const rtpmap = getAttr("rtpmap");
  const codecMatch = rtpmap.match(/\d+\s+(\w+)\/(\d+)\/(\d+)/);
  const codec = codecMatch?.[1] ?? "unknown";
  const sampleRate = parseInt(codecMatch?.[2] ?? "0");
  const channels = parseInt(codecMatch?.[3] ?? "0");

  // Direction
  const direction = content.includes("a=sendonly")
    ? "sendonly"
    : content.includes("a=recvonly")
      ? "recvonly"
      : content.includes("a=sendrecv")
        ? "sendrecv"
        : "inactive";

  // Tool
  const tool = getAttr("tool");

  // fmtp params
  const fmtpParams = getAttr("fmtp").replace(/^\d+\s+/, "");

  // Label
  const label = getAttr("label");

  return {
    participantId: label || fileName.replace(".sdp", ""),
    role,
    roomId,
    codec,
    sampleRate,
    channels,
    rtpPort,
    rtcpPort,
    direction,
    tool,
    fmtpParams,
  };
}
