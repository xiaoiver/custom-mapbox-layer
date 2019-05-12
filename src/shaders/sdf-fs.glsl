#extension GL_OES_standard_derivatives : enable

uniform sampler2D u_sdf_map;
varying vec2 v_uv;
uniform float u_gamma;
// uniform float 

float aastep(float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(0.75 - afwidth, 0.75 + afwidth, value);
}

void main() {
    float dist = texture2D(u_sdf_map, v_uv).r;
    // float alpha = smoothstep(0.75 - u_gamma, 0.75 + u_gamma, dist);
    gl_FragColor = vec4(vec3(0.), aastep(dist));
}