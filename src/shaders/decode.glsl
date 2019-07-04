#define SHIFT_RIGHT1 0.5
#define SHIFT_RIGHT2 0.25
#define SHIFT_RIGHT4 1.0 / 16.0
#define SHIFT_RIGHT6 1.0 / 64.0
#define SHIFT_RIGHT7 1.0 / 128.0
#define SHIFT_RIGHT13 1.0 / 8192.0
#define SHIFT_RIGHT14 1.0 / 16384.0
#define SHIFT_RIGHT15 1.0 / 32768.0
#define SHIFT_RIGHT16 1.0 / 65536.0
#define SHIFT_RIGHT17 1.0 / 131072.0
#define SHIFT_RIGHT18 1.0 / 262144.0
#define SHIFT_RIGHT19 1.0 / 524288.0
#define SHIFT_RIGHT20 1.0 / 1048576.0
#define SHIFT_RIGHT21 1.0 / 2097152.0
#define SHIFT_RIGHT22 1.0 / 4194304.0
#define SHIFT_RIGHT23 1.0 / 8388608.0
#define SHIFT_RIGHT24 1.0 / 16777216.0

#define SHIFT_LEFT1 2.0
#define SHIFT_LEFT2 4.0
#define SHIFT_LEFT4 16.0
#define SHIFT_LEFT6 64.0
#define SHIFT_LEFT7 128.0
#define SHIFT_LEFT13 8192.0
#define SHIFT_LEFT14 16384.0
#define SHIFT_LEFT15 32768.0
#define SHIFT_LEFT16 65536.0
#define SHIFT_LEFT17 131072.0
#define SHIFT_LEFT18 262144.0
#define SHIFT_LEFT19 524288.0
#define SHIFT_LEFT20 1048576.0
#define SHIFT_LEFT21 2097152.0
#define SHIFT_LEFT22 4194304.0
#define SHIFT_LEFT23 8388608.0
#define SHIFT_LEFT24 16777216.0

vec2 unpack_float(const float packedValue) {
  int packedIntValue = int(packedValue);
  int v0 = packedIntValue / 256;
  return vec2(v0, packedIntValue - v0 * 256);
}

vec4 decode_color(const vec2 encodedColor) {
  return vec4(
    unpack_float(encodedColor[0]) / 255.0,
    unpack_float(encodedColor[1]) / 255.0
  );
}

vec2 unpack_opacity(const float packedOpacity) {
  int intOpacity = int(packedOpacity) / 2;
  return vec2(float(intOpacity) / 127.0, mod(packedOpacity, 2.0));
}