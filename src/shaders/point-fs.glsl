precision highp float;

uniform bool u_is_circle;
varying vec4 v_color;

void main() {
    float r = 0.0;
    if (u_is_circle) {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        r = dot(cxy, cxy);
        if (r > 1.0) {
            discard;
        }
    }
    gl_FragColor = v_color;
}