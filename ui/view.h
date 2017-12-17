#ifndef VIEW_H
#define VIEW_H

#include "GL/glew.h"
#include "GL/glu.h"
#include "openglshape.h"
#include <qgl.h>
#include <QTime>
#include <QTimer>
#include <memory>

using namespace std;

class View : public QGLWidget
{
    Q_OBJECT

public:
    View(QWidget *parent);
    ~View();

    void toggleRain(bool checked);
    void toggleFog(bool checked);
    void toggleSnow(bool checked);
    void toggleAA(bool checked);
    void toggleSeaReflection(bool checked);
    void toggleSeaRefraction(bool checked);
    void toggleSeaStorm(bool checked);
    void toggleSeaShadow(bool checked);
    void toggleLadder(bool checked);
    void toggleLight(bool checked);
    void toggleAO(bool checked);
    void toggleDisplacement(bool checked);

private:
    QTime m_time;
    QTimer m_timer;
    bool m_captureMouse;

    GLuint m_helixProgramID, m_noiseTexID;
    unique_ptr<OpenGLShape> m_screenSquad;

    int m_width, m_height, m_increment;
    float m_fps;
    float m_playbackTime;
    bool m_pause;

    float m_rain;//0:no 1:yes
    float m_fog;//0:no 1:yes
    float m_snow;//0:no 1:yes
    float m_aa;//0:no 1:yes
    float m_seaReflection;//0:no 1:yes
    float m_seaRefraction;
    float m_seaStorm;
    float m_seaShadow;//0:no 1:yes
    float m_ladder;//0:no 1:yes
    float m_light;//0:no 1:yes
    float m_ao;
    float m_dis;

    void initializeGL();
    void paintGL();
    void resizeGL(int w, int h);

    void mousePressEvent(QMouseEvent *event);
    void mouseMoveEvent(QMouseEvent *event);
    void mouseReleaseEvent(QMouseEvent *event);

    void keyPressEvent(QKeyEvent *event);
    void keyReleaseEvent(QKeyEvent *event);

private slots:
    void tick();
};

#endif // VIEW_H
