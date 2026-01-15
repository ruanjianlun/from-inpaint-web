/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/control-has-associated-label */
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/outline'
import { useEffect, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import Button from './components/Button'
import FileSelect from './components/FileSelect'
import Modal from './components/Modal'
import PrivacyPolicy from './components/PrivacyPolicy'
import Editor from './Editor'
import { resizeImageFile } from './utils'
import Progress from './components/Progress'
import { downloadModel, modelExists } from './adapters/cache'
import * as m from './paraglide/messages'

function App() {
  const [file, setFile] = useState<File>()

  const [showAbout, setShowAbout] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const modalRef = useRef(null)

  const [downloadProgress, setDownloadProgress] = useState(100)
  const [isCheckingModel, setIsCheckingModel] = useState(true)

  useEffect(() => {
    async function checkAndDownloadModel() {
      setIsCheckingModel(true)
      const exists = await modelExists('inpaint')
      if (!exists) {
        console.log('[App] Model not found, starting download...')
        await downloadModel('inpaint', setDownloadProgress)
      } else {
        console.log('[App] Model found in cache, skipping download')
        setDownloadProgress(100)
      }
      setIsCheckingModel(false)
    }

    checkAndDownloadModel()
  }, [])

  useClickAway(modalRef, () => {
    setShowAbout(false)
  })

  async function startWithDemoImage(img: string) {
    const imgBlob = await fetch(`/examples/${img}.jpeg`).then(r => r.blob())
    setFile(new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' }))
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <header className="z-10 shadow flex flex-row items-center md:justify-between h-14 bg-gray-800 border-b border-gray-700">
        <Button
          className={[
            file ? '' : 'opacity-50 pointer-events-none',
            'pl-1 pr-1 mx-1 sm:mx-5',
          ].join(' ')}
          icon={<ArrowLeftIcon className="w-6 h-6" />}
          onClick={() => {
            setFile(undefined)
          }}
        >
          <div className="md:w-[290px]">
            <span className="hidden sm:inline select-none">
              {m.start_new()}
            </span>
          </div>
        </Button>
        <div className="text-4xl font-bold text-blue-400 hover:text-blue-300 transition duration-300 ease-in-out">
          Eraserly
        </div>
        <div className="hidden md:flex justify-end w-[300px] mx-1 sm:mx-5">
          <Button
            className="w-38 flex sm:visible"
            icon={<InformationCircleIcon className="w-6 h-6" />}
            onClick={() => {
              setShowAbout(true)
            }}
          >
            <p>{m.feedback()}</p>
          </Button>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col">
        {file ? (
          <Editor file={file} />
        ) : (
          <>
            <div className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden">
              <div className="h-72 sm:w-1/2 max-w-5xl">
                <FileSelect
                  onSelection={async f => {
                    const { file: resizedFile } = await resizeImageFile(
                      f,
                      1024 * 4
                    )
                    setFile(resizedFile)
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row pt-10 items-center justify-center cursor-pointer">
                <span className="text-gray-400">{m.try_it_images()}</span>
                <div className="flex space-x-2 sm:space-x-4 px-4">
                  {['bag', 'dog', 'car', 'bird', 'jacket', 'shoe', 'paris'].map(
                    image => (
                      <div
                        key={image}
                        onClick={() => startWithDemoImage(image)}
                        role="button"
                        onKeyDown={() => startWithDemoImage(image)}
                        tabIndex={-1}
                      >
                        <img
                          className="rounded-md hover:opacity-75 w-auto h-25"
                          src={`examples/${image}.jpeg`}
                          alt={image}
                          style={{ height: '100px' }}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 text-sm py-3 px-4 text-center border-t border-gray-700">
        Image editing powered by{' '}
        <a
          href="https://github.com/lxfater/inpaint-web"
          className="text-blue-400 hover:text-blue-300"
        >
          Inpaint-web
        </a>
        , licensed under{' '}
        <a
          href="https://github.com/lxfater/inpaint-web/blob/main/LICENSE"
          className="text-blue-400 hover:text-blue-300"
        >
          GNU GPL-3.0
        </a>
        .{' '}
        <button
          type="button"
          onClick={() => setShowPrivacyPolicy(true)}
          className="text-blue-400 hover:text-blue-300 underline bg-transparent border-none cursor-pointer p-0"
        >
          Privacy Policy
        </button>
      </footer>

      {showAbout && (
        <Modal>
          <div ref={modalRef} className="text-xl space-y-5 text-white">
            <p>
              For any questions please contact:{' '}
              <a
                href="mailto:zhaozed888@gmail.com"
                style={{ color: '#60a5fa' }}
              >
                zhaozed888@gmail.com
              </a>
            </p>
          </div>
        </Modal>
      )}
      {!(downloadProgress === 100) && !isCheckingModel && (
        <Modal>
          <div className="text-xl space-y-5">
            <p>{m.inpaint_model_download_message()}</p>
            <Progress percent={downloadProgress} />
          </div>
        </Modal>
      )}

      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}
    </div>
  )
}

export default App
