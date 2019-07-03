uniform sampler2D u_sdf_map;
varying vec2 v_uv;

void main() {
    gl_FragColor = texture2D(u_sdf_map, v_uv);
}