//uniform sampler2D qt_Texture0;
//varying vec4 qt_TexCoord0;
out vec4 fragColor;

void main(void)
{
//    gl_FragColor = texture2D(qt_Texture0, qt_TexCoord0.st);
    fragColor = vec4(0.5, 0.7, 0.1, 1.0);
}
