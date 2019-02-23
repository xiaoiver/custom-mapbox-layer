#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform bool u_is_circle;
varying vec4 v_color;

void main() {
    float r = 0.0, delta = 0.0, alpha = 1.0;
    if (u_is_circle) {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        r = dot(cxy, cxy);

        delta = fwidth(r);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);

    }
    gl_FragColor = v_color * alpha;
}