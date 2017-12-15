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

private:
    QTime m_time;
    QTimer m_timer;
    bool m_captureMouse;

    GLuint m_helixProgramID, m_noiseTexID;
    unique_ptr<OpenGLShape> m_screenSquad;

    int m_width, m_height, m_increment;
    float m_fps;

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
