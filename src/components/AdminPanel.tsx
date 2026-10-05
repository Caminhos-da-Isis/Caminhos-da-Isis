import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Gamepad2,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  ServiceImageUpload,
  deleteServiceImage,
} from '@/components/ServiceImageUpload';

type Review = {
  id: number;
  estrelas: number;
  comentario: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  destaque: boolean;
  created_at: string;
};

type ServiceArea =
  | 'geral'
  | 'amor'
  | 'financeiro'
  | 'pessoal'
  | 'espiritual'
  | 'relacionamentos';

type Service = {
  id: number;
  nome: string;
  preco: number;
  descricao: string;
  categoria: 'consulta' | 'tiragem';
  area: ServiceArea;
  imagem_url: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  created_at: string;
};

type ServiceForm = {
  nome: string;
  preco: string;
  descricao: string;
  categoria: 'consulta' | 'tiragem';
  area: ServiceArea;
  imagem_url: string;
  ativo: boolean;
  destaque: boolean;
  ordem: string;
};

type Filter =
  | 'pendente'
  | 'aprovada'
  | 'rejeitada';

type AdminTab =
  | 'avaliacoes'
  | 'jogos'
  | 'pedidos'
  | 'agenda';

type AvailabilityDay = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

type Appointment = {
  id: number;
  order_id: number;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  status:
    | 'reservado'
    | 'confirmado'
    | 'em_atendimento'
    | 'concluido'
    | 'cancelado';
};

type ScheduleBlock = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type OrderItem = {
  id: number;
  service_name: string;
  category: 'consulta' | 'tiragem';
  unit_price: number;
  quantity: number;
  total_price: number;
  question: string | null;
  duration_minutes: number | null;
};

type Order = {
  id: number;
  user_id: string;
  status:
    | 'rascunho'
    | 'aguardando_pagamento'
    | 'pago'
    | 'em_atendimento'
    | 'finalizado'
    | 'cancelado';
  payment_status:
    | 'pendente'
    | 'pago'
    | 'falhou'
    | 'cancelado'
    | 'reembolsado';
  total: number;
  appointment_start_at: string | null;
  appointment_end_at: string | null;
  duration_minutes: number | null;
  created_at: string;
  order_items?: OrderItem[];
};

const emptyServiceForm: ServiceForm = {
  nome: '',
  preco: '',
  descricao: '',
  categoria: 'tiragem',
  area: 'geral',
  imagem_url: '',
  ativo: true,
  destaque: false,
  ordem: '1',
};

export function AdminPanel() {
  const [open, setOpen] = useState(false);

  const [tab, setTab] =
    useState<AdminTab>('avaliacoes');

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [filter, setFilter] =
    useState<Filter>('pendente');

  const [services, setServices] =
    useState<Service[]>([]);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [agendaDate, setAgendaDate] =
    useState(getTodayInSaoPaulo());

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [
    availabilityDays,
    setAvailabilityDays,
  ] = useState<AvailabilityDay[]>([]);

  const [
    showAvailabilitySettings,
    setShowAvailabilitySettings,
  ] = useState(false);

  const [
    savingAvailabilityDay,
    setSavingAvailabilityDay,
  ] = useState<number | null>(null);

  const [
    scheduleBlocks,
    setScheduleBlocks,
  ] = useState<ScheduleBlock[]>([]);

  const [
    agendaStartTime,
    setAgendaStartTime,
  ] = useState('10:00');

  const [
    agendaEndTime,
    setAgendaEndTime,
  ] = useState('10:30');

  const [
    agendaReason,
    setAgendaReason,
  ] = useState('');

  const [
    savingBlock,
    setSavingBlock,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [actionId, setActionId] =
    useState<number | null>(null);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [
    serviceModalOpen,
    setServiceModalOpen,
  ] = useState(false);

  const [
    editingService,
    setEditingService,
  ] = useState<Service | null>(null);

  const [
    serviceForm,
    setServiceForm,
  ] = useState<ServiceForm>(
    emptyServiceForm
  );

  const [
    savingService,
    setSavingService,
  ] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }

    document.addEventListener(
      'open-admin-panel',
      handleOpen
    );

    return () => {
      document.removeEventListener(
        'open-admin-panel',
        handleOpen
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    if (tab === 'avaliacoes') {
      loadReviews();
    } else if (tab === 'jogos') {
      loadServices();
    } else if (tab === 'pedidos') {
      loadOrders();
    } else {
      loadAgenda();
    }
  }, [open, tab, filter]);

  useEffect(() => {
    if (!open || tab !== 'agenda') {
      return;
    }

    loadAgenda();
  }, [agendaDate]);

  useEffect(() => {
    document.body.style.overflow =
      open || serviceModalOpen
        ? 'hidden'
        : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, serviceModalOpen]);

  /* =====================================================
     AVALIAÇÕES
  ===================================================== */

  async function loadReviews() {
    setLoading(true);
    setError('');

    const { data, error } =
      await supabase
        .from('reviews')
        .select(
          'id, estrelas, comentario, status, destaque, created_at'
        )
        .eq('status', filter)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      setError(
        'Não foi possível carregar as avaliações.'
      );

      setReviews([]);
    } else {
      setReviews(
        (data ?? []) as Review[]
      );
    }

    setLoading(false);
  }

  async function updateReview(
    id: number,
    changes: Partial<
      Pick<
        Review,
        'status' | 'destaque'
      >
    >
  ) {
    setActionId(id);
    setError('');

    const { error } =
      await supabase
        .from('reviews')
        .update(changes)
        .eq('id', id);

    if (error) {
      setError(
        'Não foi possível alterar essa avaliação.'
      );

      setActionId(null);
      return;
    }

    await loadReviews();

    setActionId(null);
  }

  async function deleteReview(
    id: number
  ) {
    const confirmed =
      window.confirm(
        'Deseja realmente excluir esta avaliação?'
      );

    if (!confirmed) return;

    setActionId(id);
    setError('');

    const { error } =
      await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

    if (error) {
      setError(
        'Não foi possível excluir essa avaliação.'
      );

      setActionId(null);
      return;
    }

    await loadReviews();

    setActionId(null);
  }

  /* =====================================================
     JOGOS
  ===================================================== */

  async function loadServices() {
    setLoading(true);
    setError('');

    const { data, error } =
      await supabase
        .from('services')
        .select(
          'id, nome, preco, descricao, categoria, area, imagem_url, ativo, destaque, ordem, created_at'
        )
        .order('categoria', {
          ascending: true,
        })
        .order('ordem', {
          ascending: true,
        });

    if (error) {
      console.error(error);

      setError(
        'Não foi possível carregar os jogos.'
      );

      setServices([]);
    } else {
      setServices(
        (data ?? []) as Service[]
      );
    }

    setLoading(false);
  }

  function openNewService() {
    setEditingService(null);

    setServiceForm({
      ...emptyServiceForm,

      ordem: String(
        services.length + 1
      ),
    });

    setError('');
    setSuccess('');

    setServiceModalOpen(true);
  }

  function openEditService(
    service: Service
  ) {
    setEditingService(service);

    setServiceForm({
      nome: service.nome,

      preco: String(
        service.preco
      ),

      descricao:
        service.descricao,

      categoria:
        service.categoria,

      area:
        service.area ?? 'geral',

      imagem_url:
        service.imagem_url ?? '',

      ativo:
        service.ativo,

      destaque:
        service.destaque,

      ordem: String(
        service.ordem
      ),
    });

    setError('');
    setSuccess('');

    setServiceModalOpen(true);
  }

  async function cleanupTemporaryServiceImage() {
    const currentImage =
      serviceForm.imagem_url;

    const originalImage =
      editingService?.imagem_url ??
      '';

    /*
      Se foi enviada uma imagem nova
      durante a edição, mas o usuário
      fechar sem salvar, removemos a
      imagem temporária.
    */
    if (
      currentImage &&
      currentImage !== originalImage
    ) {
      await deleteServiceImage(
        currentImage
      );
    }
  }

  async function handleServiceImageUpload(
    newImageUrl: string
  ) {
    const currentImage =
      serviceForm.imagem_url;

    const originalImage =
      editingService?.imagem_url ??
      '';

    /*
      Se já havia uma imagem NOVA
      enviada nesta edição e o usuário
      escolheu outra, apagamos a
      temporária anterior.
    */
    if (
      currentImage &&
      currentImage !== originalImage &&
      currentImage !== newImageUrl
    ) {
      await deleteServiceImage(
        currentImage
      );
    }

    setServiceForm(
      (current) => ({
        ...current,

        imagem_url:
          newImageUrl,
      })
    );
  }

  async function handleRemoveServiceImage() {
    const currentImage =
      serviceForm.imagem_url;

    const originalImage =
      editingService?.imagem_url ??
      '';

    /*
      Se for uma imagem recém-enviada
      e ainda não salva, podemos apagar
      imediatamente.

      Se for a imagem original do jogo,
      ela só será apagada depois que o
      banco salvar a alteração.
    */
    if (
      currentImage &&
      currentImage !== originalImage
    ) {
      await deleteServiceImage(
        currentImage
      );
    }

    setServiceForm(
      (current) => ({
        ...current,

        imagem_url: '',
      })
    );
  }

  async function closeServiceModal() {
    if (savingService) {
      return;
    }

    await cleanupTemporaryServiceImage();

    setServiceModalOpen(false);

    setEditingService(null);

    setServiceForm(
      emptyServiceForm
    );
  }

  async function saveService() {
    setError('');
    setSuccess('');

    const nome =
      serviceForm.nome.trim();

    const descricao =
      serviceForm.descricao.trim();

    const preco = Number(
      serviceForm.preco
        .replace(',', '.')
        .replace('R$', '')
        .trim()
    );

    const ordem = Number(
      serviceForm.ordem
    );

    if (!nome) {
      setError(
        'Informe o nome do jogo.'
      );

      return;
    }

    if (
      !Number.isFinite(preco) ||
      preco < 0
    ) {
      setError(
        'Informe um preço válido.'
      );

      return;
    }

    if (!descricao) {
      setError(
        'Informe a descrição do jogo.'
      );

      return;
    }

    if (
      !Number.isInteger(ordem) ||
      ordem < 1
    ) {
      setError(
        'A ordem precisa ser um número inteiro maior que zero.'
      );

      return;
    }

    setSavingService(true);

    const wasEditing =
      Boolean(editingService);

    const originalImage =
      editingService?.imagem_url ??
      '';

    const currentFormImage =
      serviceForm.imagem_url.trim();

    /*
      Consultas não usam imagem de
      tiragem.

      Para tiragens salvamos a imagem
      selecionada.
    */
    const savedImage =
      serviceForm.categoria ===
      'tiragem'
        ? currentFormImage
        : '';

    const payload = {
      nome,

      preco,

      descricao,

      categoria:
        serviceForm.categoria,

      area:
        serviceForm.categoria ===
        'tiragem'
          ? serviceForm.area
          : 'geral',

      imagem_url:
        savedImage || null,

      ativo:
        serviceForm.ativo,

      destaque:
        serviceForm.destaque,

      ordem,
    };

    if (editingService) {
      const { error } =
        await supabase
          .from('services')
          .update(payload)
          .eq(
            'id',
            editingService.id
          );

      if (error) {
        console.error(error);

        setError(
          'Não foi possível salvar as alterações.'
        );

        setSavingService(false);

        return;
      }
    } else {
      const { error } =
        await supabase
          .from('services')
          .insert(payload);

      if (error) {
        console.error(error);

        setError(
          'Não foi possível criar o novo jogo.'
        );

        setSavingService(false);

        return;
      }
    }

    /*
      Só apagamos imagens antigas
      DEPOIS que o banco salvou
      corretamente.
    */
    const imagesToDelete =
      new Set<string>();

    /*
      Exemplo:
      tiragem virou consulta.

      A imagem atual não será usada
      no registro salvo.
    */
    if (
      currentFormImage &&
      currentFormImage !==
        savedImage
    ) {
      imagesToDelete.add(
        currentFormImage
      );
    }

    /*
      Se trocou ou removeu a imagem
      original, apagamos a antiga.
    */
    if (
      originalImage &&
      originalImage !== savedImage
    ) {
      imagesToDelete.add(
        originalImage
      );
    }

    for (
      const imageUrl
      of imagesToDelete
    ) {
      await deleteServiceImage(
        imageUrl
      );
    }

    setSavingService(false);

    setServiceModalOpen(false);

    setEditingService(null);

    setServiceForm(
      emptyServiceForm
    );

    setSuccess(
      wasEditing
        ? 'Jogo atualizado com sucesso ✦'
        : 'Novo jogo criado com sucesso ✦'
    );

    await loadServices();
  }

  async function toggleService(
    service: Service
  ) {
    setActionId(service.id);

    setError('');
    setSuccess('');

    const { error } =
      await supabase
        .from('services')
        .update({
          ativo:
            !service.ativo,
        })
        .eq(
          'id',
          service.id
        );

    if (error) {
      console.error(error);

      setError(
        'Não foi possível alterar a disponibilidade.'
      );

      setActionId(null);

      return;
    }

    await loadServices();

    setActionId(null);

    setSuccess(
      service.ativo
        ? 'Jogo desativado.'
        : 'Jogo ativado ✦'
    );
  }

  async function toggleHighlight(
    service: Service
  ) {
    setActionId(service.id);

    setError('');
    setSuccess('');

    const { error } =
      await supabase
        .from('services')
        .update({
          destaque:
            !service.destaque,
        })
        .eq(
          'id',
          service.id
        );

    if (error) {
      console.error(error);

      setError(
        'Não foi possível alterar o destaque.'
      );

      setActionId(null);

      return;
    }

    await loadServices();

    setActionId(null);
  }

  async function deleteService(
    service: Service
  ) {
    const confirmed =
      window.confirm(
        `Deseja realmente excluir "${service.nome}"?\n\nEssa ação não poderá ser desfeita.`
      );

    if (!confirmed) return;

    setActionId(service.id);

    setError('');
    setSuccess('');

    const { error } =
      await supabase
        .from('services')
        .delete()
        .eq(
          'id',
          service.id
        );

    if (error) {
      console.error(error);

      setError(
        'Não foi possível excluir esse jogo.'
      );

      setActionId(null);

      return;
    }

    /*
      Se o jogo possuía imagem,
      também removemos o arquivo
      do Storage.
    */
    if (service.imagem_url) {
      await deleteServiceImage(
        service.imagem_url
      );
    }

    await loadServices();

    setActionId(null);

    setSuccess(
      'Jogo excluído.'
    );
  }

  /* =====================================================
     AGENDA
  ===================================================== */

  async function loadAgenda() {
    setLoading(true);
    setError('');

    const {
      startIso,
      endIso,
    } = getSaoPauloDayRange(
      agendaDate
    );

    const [
      appointmentsResult,
      blocksResult,
      availabilityResult,
    ] = await Promise.all([
      supabase
        .from('appointments')
        .select(
          'id, order_id, start_at, end_at, duration_minutes, status'
        )
        .gte(
          'start_at',
          startIso
        )
        .lt(
          'start_at',
          endIso
        )
        .neq(
          'status',
          'cancelado'
        )
        .order(
          'start_at',
          {
            ascending: true,
          }
        ),

      supabase
        .from('schedule_blocks')
        .select(
          'id, start_at, end_at, reason'
        )
        .lt(
          'start_at',
          endIso
        )
        .gt(
          'end_at',
          startIso
        )
        .order(
          'start_at',
          {
            ascending: true,
          }
        ),

      supabase
        .from('availability')
        .select(
          'id, day_of_week, start_time, end_time, active'
        )
        .order(
          'day_of_week',
          {
            ascending: true,
          }
        ),
    ]);

    if (
      appointmentsResult.error
    ) {
      console.error(
        appointmentsResult.error
      );

      setError(
        'Não foi possível carregar os atendimentos da agenda.'
      );

      setAppointments([]);
    } else {
      setAppointments(
        (
          appointmentsResult.data ??
          []
        ) as Appointment[]
      );
    }

    if (blocksResult.error) {
      console.error(
        blocksResult.error
      );

      setError(
        'Não foi possível carregar os bloqueios da agenda.'
      );

      setScheduleBlocks([]);
    } else {
      setScheduleBlocks(
        (
          blocksResult.data ??
          []
        ) as ScheduleBlock[]
      );
    }

    if (
      availabilityResult.error
    ) {
      console.error(
        availabilityResult.error
      );

      setError(
        'Não foi possível carregar os horários de atendimento.'
      );

      setAvailabilityDays([]);
    } else {
      setAvailabilityDays(
        (
          availabilityResult.data ??
          []
        ) as AvailabilityDay[]
      );
    }

    setLoading(false);
  }

  function updateAvailabilityLocal(
    dayOfWeek: number,
    changes: Partial<
      Pick<
        AvailabilityDay,
        | 'start_time'
        | 'end_time'
        | 'active'
      >
    >
  ) {
    setAvailabilityDays(
      (current) =>
        current.map(
          (day) =>
            day.day_of_week ===
            dayOfWeek
              ? {
                  ...day,
                  ...changes,
                }
              : day
        )
    );
  }

  async function saveAvailabilityDay(
    day: AvailabilityDay
  ) {
    setError('');
    setSuccess('');

    if (
      day.active &&
      day.end_time <=
        day.start_time
    ) {
      setError(
        `${getWeekdayName(
          day.day_of_week
        )}: o horário final precisa ser depois do horário inicial.`
      );

      return;
    }

    setSavingAvailabilityDay(
      day.day_of_week
    );

    const { error } =
      await supabase
        .from('availability')
        .update({
          active:
            day.active,

          start_time:
            normalizeTimeForDatabase(
              day.start_time
            ),

          end_time:
            normalizeTimeForDatabase(
              day.end_time
            ),
        })
        .eq(
          'id',
          day.id
        );

    if (error) {
      console.error(error);

      setError(
        `Não foi possível salvar ${getWeekdayName(
          day.day_of_week
        )}.`
      );

      setSavingAvailabilityDay(
        null
      );

      await loadAgenda();

      return;
    }

    setSuccess(
      `${getWeekdayName(
        day.day_of_week
      )} atualizado com sucesso ✦`
    );

    setSavingAvailabilityDay(
      null
    );

    await loadAgenda();
  }

  async function createScheduleBlock() {
    setError('');
    setSuccess('');

    if (
      !agendaStartTime ||
      !agendaEndTime
    ) {
      setError(
        'Informe o início e o fim do bloqueio.'
      );

      return;
    }

    if (
      agendaEndTime <=
      agendaStartTime
    ) {
      setError(
        'O horário final precisa ser depois do horário inicial.'
      );

      return;
    }

    const startAt =
      saoPauloLocalToIso(
        agendaDate,
        agendaStartTime
      );

    const endAt =
      saoPauloLocalToIso(
        agendaDate,
        agendaEndTime
      );

    const overlapsAppointment =
      appointments.some(
        (appointment) => {
          const appointmentStart =
            new Date(
              appointment.start_at
            ).getTime();

          const appointmentEnd =
            new Date(
              appointment.end_at
            ).getTime();

          return (
            new Date(
              startAt
            ).getTime() <
              appointmentEnd &&
            new Date(
              endAt
            ).getTime() >
              appointmentStart
          );
        }
      );

    if (overlapsAppointment) {
      setError(
        'Esse período já possui um atendimento reservado ou confirmado.'
      );

      return;
    }

    setSavingBlock(true);

    const { error } =
      await supabase
        .from(
          'schedule_blocks'
        )
        .insert({
          start_at: startAt,

          end_at: endAt,

          reason:
            agendaReason.trim() ||
            'Indisponível',
        });

    if (error) {
      console.error(error);

      setError(
        'Não foi possível bloquear esse horário.'
      );

      setSavingBlock(false);

      return;
    }

    setAgendaReason('');

    setSuccess(
      'Horário bloqueado. Ele não aparecerá mais para clientes ✦'
    );

    await loadAgenda();

    setSavingBlock(false);
  }

  async function deleteScheduleBlock(
    block: ScheduleBlock
  ) {
    const confirmed =
      window.confirm(
        'Liberar este período novamente para agendamentos?'
      );

    if (!confirmed) return;

    setActionId(block.id);

    setError('');
    setSuccess('');

    const { error } =
      await supabase
        .from(
          'schedule_blocks'
        )
        .delete()
        .eq(
          'id',
          block.id
        );

    if (error) {
      console.error(error);

      setError(
        'Não foi possível liberar esse horário.'
      );

      setActionId(null);

      return;
    }

    setSuccess(
      'Horário liberado novamente ✦'
    );

    await loadAgenda();

    setActionId(null);
  }

  function changeAgendaDay(
    days: number
  ) {
    setAgendaDate(
      addDaysToDateString(
        agendaDate,
        days
      )
    );

    setError('');
    setSuccess('');
  }

  /* =====================================================
     PEDIDOS
  ===================================================== */

  async function loadOrders() {
    setLoading(true);

    setError('');
    setSuccess('');

    const { data, error } =
      await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          status,
          payment_status,
          total,
          appointment_start_at,
          appointment_end_at,
          duration_minutes,
          created_at,
          order_items (
            id,
            service_name,
            category,
            unit_price,
            quantity,
            total_price,
            question,
            duration_minutes
          )
        `)
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(error);

      setOrders([]);

      setError(
        'Não foi possível carregar os pedidos.'
      );
    } else {
      setOrders(
        (data ?? []) as Order[]
      );
    }

    setLoading(false);
  }

  async function confirmOrderPayment(
    order: Order
  ) {
    const confirmed =
      window.confirm(
        `Confirmar o pagamento do pedido #${order.id}?`
      );

    if (!confirmed) return;

    setActionId(order.id);

    setError('');
    setSuccess('');

    const {
      error: orderError,
    } = await supabase
      .from('orders')
      .update({
        status: 'pago',

        payment_status:
          'pago',

        paid_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        order.id
      );

    if (orderError) {
      console.error(
        orderError
      );

      setError(
        'Não foi possível confirmar o pagamento.'
      );

      setActionId(null);

      return;
    }

    const {
      error:
        appointmentError,
    } = await supabase
      .from('appointments')
      .update({
        status:
          'confirmado',
      })
      .eq(
        'order_id',
        order.id
      );

    if (appointmentError) {
      console.error(
        appointmentError
      );

      /*
        Reverte o pedido para
        evitar pagamento confirmado
        com horário não confirmado.
      */
      await supabase
        .from('orders')
        .update({
          status:
            'aguardando_pagamento',

          payment_status:
            'pendente',

          paid_at: null,
        })
        .eq(
          'id',
          order.id
        );

      setError(
        'Não foi possível confirmar o horário. O pedido não foi alterado.'
      );

      setActionId(null);

      return;
    }

    setSuccess(
      `Pagamento do pedido #${order.id} confirmado ✦`
    );

    await loadOrders();

    setActionId(null);
  }

  async function cancelOrder(
    order: Order
  ) {
    const confirmed =
      window.confirm(
        `Cancelar o pedido #${order.id}?\n\nO horário reservado será liberado novamente no site.`
      );

    if (!confirmed) return;

    setActionId(order.id);

    setError('');
    setSuccess('');

    const {
      error:
        appointmentError,
    } = await supabase
      .from('appointments')
      .update({
        status:
          'cancelado',
      })
      .eq(
        'order_id',
        order.id
      );

    if (appointmentError) {
      console.error(
        appointmentError
      );

      setError(
        'Não foi possível liberar o horário deste pedido.'
      );

      setActionId(null);

      return;
    }

    const {
      error: orderError,
    } = await supabase
      .from('orders')
      .update({
        status:
          'cancelado',

        payment_status:
          order.payment_status ===
          'pago'
            ? 'reembolsado'
            : 'cancelado',
      })
      .eq(
        'id',
        order.id
      );

    if (orderError) {
      console.error(
        orderError
      );

      await supabase
        .from('appointments')
        .update({
          status:
            order.payment_status ===
            'pago'
              ? 'confirmado'
              : 'reservado',
        })
        .eq(
          'order_id',
          order.id
        );

      setError(
        'Não foi possível cancelar o pedido.'
      );

      setActionId(null);

      return;
    }

    setSuccess(
      `Pedido #${order.id} cancelado. O horário foi liberado.`
    );

    await loadOrders();

    setActionId(null);
  }

  /* =====================================================
     RENDER
  ===================================================== */

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-bordo-300 overflow-y-auto">
        <div className="w-full max-w-[480px] min-h-screen mx-auto bg-bordo-300">

          {/* TOPO */}
          <header className="sticky top-0 z-20 bg-bordo-300/95 backdrop-blur-md border-b border-dourado-200/15">
            <div className="h-16 px-5 flex items-center justify-between">
              <div>
                <p className="font-serif text-[10px] tracking-[0.22em] text-dourado-200/50 uppercase">
                  Caminhos de Isis
                </p>

                <h1 className="font-serif text-lg tracking-[0.1em] text-gradient-gold">
                  PAINEL ADMINISTRATIVO
                </h1>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="w-9 h-9 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/70"
                aria-label="Fechar painel"
              >
                <X
                  className="w-4 h-4"
                  strokeWidth={1.5}
                />
              </button>
            </div>
          </header>

          <main className="px-5 py-7">

            {/* BOAS-VINDAS */}
            <section className="rounded-2xl border border-dourado-200/20 bg-bordo-200/50 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-dourado-200/30 flex items-center justify-center">
                  <span className="text-dourado-200 text-lg">
                    ✦
                  </span>
                </div>

                <div>
                  <p className="font-serif text-lg text-creme/90">
                    Olá, Isis ✦
                  </p>

                  <p className="font-serif text-xs text-dourado-200/50 mt-1 tracking-[0.12em] uppercase">
                    Administradora
                  </p>
                </div>
              </div>
            </section>

            {/* ABAS */}
            <div className="grid grid-cols-4 gap-2 mt-7">

              <button
                type="button"
                onClick={() => {
                  setTab(
                    'avaliacoes'
                  );

                  setError('');
                  setSuccess('');
                }}
                className={`rounded-xl border py-3 font-serif text-xs transition ${
                  tab ===
                  'avaliacoes'
                    ? 'border-dourado-200/45 bg-dourado-200/10 text-dourado-200'
                    : 'border-dourado-200/15 text-creme/40'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Star
                    className="w-4 h-4"
                    strokeWidth={1.4}
                  />

                  Avaliações
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('jogos');

                  setError('');
                  setSuccess('');
                }}
                className={`rounded-xl border py-3 font-serif text-xs transition ${
                  tab === 'jogos'
                    ? 'border-dourado-200/45 bg-dourado-200/10 text-dourado-200'
                    : 'border-dourado-200/15 text-creme/40'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Gamepad2
                    className="w-4 h-4"
                    strokeWidth={1.4}
                  />

                  Jogos
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab(
                    'pedidos'
                  );

                  setError('');
                  setSuccess('');
                }}
                className={`rounded-xl border py-3 font-serif text-[10px] transition ${
                  tab === 'pedidos'
                    ? 'border-dourado-200/45 bg-dourado-200/10 text-dourado-200'
                    : 'border-dourado-200/15 text-creme/40'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <PackageCheck
                    className="w-4 h-4"
                    strokeWidth={1.4}
                  />

                  Pedidos
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab(
                    'agenda'
                  );

                  setError('');
                  setSuccess('');
                }}
                className={`rounded-xl border py-3 font-serif text-[10px] transition ${
                  tab === 'agenda'
                    ? 'border-dourado-200/45 bg-dourado-200/10 text-dourado-200'
                    : 'border-dourado-200/15 text-creme/40'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <CalendarDays
                    className="w-4 h-4"
                    strokeWidth={1.4}
                  />

                  Agenda
                </span>
              </button>
            </div>

            {/* ========================================
                AVALIAÇÕES
            ======================================== */}

            {tab ===
              'avaliacoes' && (
              <>
                <div className="flex items-end justify-between mt-9 mb-5">
                  <div>
                    <p className="font-serif text-[10px] tracking-[0.22em] text-dourado-200/45 uppercase">
                      Gerenciamento
                    </p>

                    <h2 className="font-serif text-2xl text-creme/90 mt-1">
                      Avaliações
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      loadReviews
                    }
                    disabled={
                      loading
                    }
                    className="w-9 h-9 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/60 disabled:opacity-40"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loading
                          ? 'animate-spin'
                          : ''
                      }`}
                      strokeWidth={
                        1.4
                      }
                    />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">

                  <FilterButton
                    active={
                      filter ===
                      'pendente'
                    }
                    onClick={() =>
                      setFilter(
                        'pendente'
                      )
                    }
                  >
                    Pendentes
                  </FilterButton>

                  <FilterButton
                    active={
                      filter ===
                      'aprovada'
                    }
                    onClick={() =>
                      setFilter(
                        'aprovada'
                      )
                    }
                  >
                    Aprovadas
                  </FilterButton>

                  <FilterButton
                    active={
                      filter ===
                      'rejeitada'
                    }
                    onClick={() =>
                      setFilter(
                        'rejeitada'
                      )
                    }
                  >
                    Rejeitadas
                  </FilterButton>
                </div>

                <Messages
                  error={error}
                  success={success}
                />

                {loading && (
                  <Loading />
                )}

                {!loading &&
                  reviews.length ===
                    0 && (
                    <div className="py-16 flex flex-col items-center text-center">
                      <Clock3
                        className="w-7 h-7 text-dourado-200/30"
                        strokeWidth={
                          1.3
                        }
                      />

                      <p className="font-serif text-sm text-creme/45 mt-4">
                        Nenhuma avaliação nesta categoria.
                      </p>
                    </div>
                  )}

                {!loading &&
                  reviews.length >
                    0 && (
                    <div className="flex flex-col gap-4 mt-6">
                      {reviews.map(
                        (
                          review
                        ) => {
                          const processing =
                            actionId ===
                            review.id;

                          return (
                            <article
                              key={
                                review.id
                              }
                              className="rounded-2xl border border-dourado-200/20 bg-bordo-200/45 p-5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                  {[
                                    1,
                                    2,
                                    3,
                                    4,
                                    5,
                                  ].map(
                                    (
                                      star
                                    ) => (
                                      <Star
                                        key={
                                          star
                                        }
                                        className={`w-4 h-4 ${
                                          star <=
                                          review.estrelas
                                            ? 'text-dourado-200 fill-current'
                                            : 'text-dourado-200/20'
                                        }`}
                                        strokeWidth={
                                          1.2
                                        }
                                      />
                                    )
                                  )}
                                </div>

                                {review.destaque && (
                                  <span className="font-serif text-[9px] tracking-[0.15em] text-dourado-200/60 uppercase">
                                    Destaque ✦
                                  </span>
                                )}
                              </div>

                              <p className="font-serif text-[15px] text-creme/80 leading-[175%] mt-4">
                                {
                                  review.comentario
                                }
                              </p>

                              <p className="font-serif text-[10px] text-creme/25 mt-4">
                                {new Date(
                                  review.created_at
                                ).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </p>

                              <div className="mt-5 pt-4 border-t border-dourado-200/10">

                                {filter ===
                                  'pendente' && (
                                  <div className="grid grid-cols-2 gap-2">

                                    <ActionButton
                                      disabled={
                                        processing
                                      }
                                      onClick={() =>
                                        updateReview(
                                          review.id,
                                          {
                                            status:
                                              'aprovada',
                                          }
                                        )
                                      }
                                    >
                                      <Check className="w-4 h-4" />

                                      Aprovar
                                    </ActionButton>

                                    <ActionButton
                                      disabled={
                                        processing
                                      }
                                      onClick={() =>
                                        updateReview(
                                          review.id,
                                          {
                                            status:
                                              'rejeitada',
                                          }
                                        )
                                      }
                                    >
                                      <XCircle className="w-4 h-4" />

                                      Rejeitar
                                    </ActionButton>
                                  </div>
                                )}

                                {filter ===
                                  'aprovada' && (
                                  <button
                                    type="button"
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      updateReview(
                                        review.id,
                                        {
                                          destaque:
                                            !review.destaque,
                                        }
                                      )
                                    }
                                    className="w-full rounded-xl border border-dourado-200/20 px-4 py-3 font-serif text-xs text-dourado-200/75 disabled:opacity-40"
                                  >
                                    {review.destaque
                                      ? 'Remover dos destaques'
                                      : 'Marcar como destaque ✦'}
                                  </button>
                                )}

                                {filter ===
                                  'rejeitada' && (
                                  <button
                                    type="button"
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      updateReview(
                                        review.id,
                                        {
                                          status:
                                            'aprovada',
                                        }
                                      )
                                    }
                                    className="w-full rounded-xl border border-dourado-200/20 px-4 py-3 font-serif text-xs text-dourado-200/75 disabled:opacity-40"
                                  >
                                    Aprovar avaliação
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    deleteReview(
                                      review.id
                                    )
                                  }
                                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 font-serif text-xs text-creme/35 hover:text-red-300/70 disabled:opacity-40"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />

                                  Excluir
                                </button>
                              </div>
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
              </>
            )}

            {/* ========================================
                JOGOS
            ======================================== */}

            {tab === 'jogos' && (
              <>
                <div className="flex items-end justify-between mt-9 mb-5">
                  <div>
                    <p className="font-serif text-[10px] tracking-[0.22em] text-dourado-200/45 uppercase">
                      Gerenciamento
                    </p>

                    <h2 className="font-serif text-2xl text-creme/90 mt-1">
                      Jogos
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      loadServices
                    }
                    disabled={
                      loading
                    }
                    className="w-9 h-9 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/60 disabled:opacity-40"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loading
                          ? 'animate-spin'
                          : ''
                      }`}
                      strokeWidth={
                        1.4
                      }
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={
                    openNewService
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-dourado-200/35 bg-dourado-200/10 px-4 py-3.5 font-serif text-sm text-dourado-200"
                >
                  <Plus
                    className="w-4 h-4"
                    strokeWidth={
                      1.5
                    }
                  />

                  Novo jogo
                </button>

                <Messages
                  error={error}
                  success={success}
                />

                {loading && (
                  <Loading />
                )}

                {!loading &&
                  services.length ===
                    0 && (
                    <div className="py-16 text-center">
                      <p className="font-serif text-sm text-creme/45">
                        Nenhum jogo cadastrado.
                      </p>
                    </div>
                  )}

                {!loading &&
                  services.length >
                    0 && (
                    <div className="flex flex-col gap-4 mt-6">

                      {services.map(
                        (
                          service
                        ) => {
                          const processing =
                            actionId ===
                            service.id;

                          return (
                            <article
                              key={
                                service.id
                              }
                              className={`rounded-2xl border p-5 ${
                                service.ativo
                                  ? 'border-dourado-200/20 bg-bordo-200/45'
                                  : 'border-creme/10 bg-bordo-200/20 opacity-60'
                              }`}
                            >

                              {/* IMAGEM NO ADMIN */}
                              {service.imagem_url && (
                                <div className="mb-4 overflow-hidden rounded-xl border border-dourado-200/15 bg-bordo-300">
                                  <div className="aspect-[16/9] overflow-hidden">
                                    <img
                                      src={
                                        service.imagem_url
                                      }
                                      alt={`Imagem de ${service.nome}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">

                                  <div className="flex items-center gap-2 flex-wrap">

                                    <span className="font-serif text-[9px] tracking-[0.15em] text-dourado-200/50 uppercase">
                                      {service.categoria ===
                                      'consulta'
                                        ? 'Consulta'
                                        : 'Tiragem'}
                                    </span>

                                    {service.categoria ===
                                      'tiragem' && (
                                      <span className="font-serif text-[9px] text-creme/35 uppercase">
                                        •{' '}
                                        {formatServiceArea(
                                          service.area
                                        )}
                                      </span>
                                    )}

                                    {!service.ativo && (
                                      <span className="font-serif text-[9px] text-creme/30 uppercase">
                                        • Inativo
                                      </span>
                                    )}

                                    {service.destaque && (
                                      <span className="font-serif text-[9px] text-dourado-200/60 uppercase">
                                        • Destaque ✦
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="font-serif text-lg text-creme/90 mt-2">
                                    {
                                      service.nome
                                    }
                                  </h3>
                                </div>

                                <span className="font-serif text-lg text-dourado-200 whitespace-nowrap">
                                  {Number(
                                    service.preco
                                  ).toLocaleString(
                                    'pt-BR',
                                    {
                                      style:
                                        'currency',

                                      currency:
                                        'BRL',
                                    }
                                  )}
                                </span>
                              </div>

                              <p className="font-serif text-sm text-creme/55 leading-relaxed mt-4">
                                {
                                  service.descricao
                                }
                              </p>

                              <div className="flex items-center justify-between mt-5 pt-4 border-t border-dourado-200/10">

                                <span className="font-serif text-[10px] text-creme/30">
                                  Ordem:{' '}
                                  {
                                    service.ordem
                                  }
                                </span>

                                <span
                                  className={`font-serif text-[10px] ${
                                    service.ativo
                                      ? 'text-dourado-200/60'
                                      : 'text-creme/30'
                                  }`}
                                >
                                  {service.ativo
                                    ? 'Ativo'
                                    : 'Desativado'}
                                </span>
                              </div>

                              {/* EDITAR */}
                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  openEditService(
                                    service
                                  )
                                }
                                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-4 py-3 font-serif text-xs text-dourado-200/80 disabled:opacity-40"
                              >
                                <Edit3
                                  className="w-3.5 h-3.5"
                                  strokeWidth={
                                    1.4
                                  }
                                />

                                Editar
                              </button>

                              {/* ATIVO / DESTAQUE */}
                              <div className="grid grid-cols-2 gap-2 mt-2">

                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    toggleService(
                                      service
                                    )
                                  }
                                  className="rounded-xl border border-dourado-200/15 px-2 py-3 font-serif text-[10px] text-creme/55 disabled:opacity-40"
                                >
                                  {service.ativo
                                    ? 'Desativar'
                                    : 'Ativar'}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    toggleHighlight(
                                      service
                                    )
                                  }
                                  className="rounded-xl border border-dourado-200/15 px-2 py-3 font-serif text-[10px] text-dourado-200/65 disabled:opacity-40"
                                >
                                  {service.destaque
                                    ? 'Tirar destaque'
                                    : 'Destacar ✦'}
                                </button>
                              </div>

                              {/* EXCLUIR */}
                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  deleteService(
                                    service
                                  )
                                }
                                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 font-serif text-[10px] text-creme/30 hover:text-red-300/70 disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />

                                Excluir jogo
                              </button>
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
              </>
            )}

            {/* ========================================
                PEDIDOS
            ======================================== */}

            {tab ===
              'pedidos' && (
              <>
                <div className="flex items-end justify-between mt-9 mb-5">
                  <div>
                    <p className="font-serif text-[10px] tracking-[0.22em] text-dourado-200/45 uppercase">
                      Gerenciamento
                    </p>

                    <h2 className="font-serif text-2xl text-creme/90 mt-1">
                      Pedidos
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      loadOrders
                    }
                    disabled={
                      loading
                    }
                    className="w-9 h-9 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/60 disabled:opacity-40"
                    aria-label="Atualizar pedidos"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loading
                          ? 'animate-spin'
                          : ''
                      }`}
                      strokeWidth={
                        1.4
                      }
                    />
                  </button>
                </div>

                <Messages
                  error={error}
                  success={success}
                />

                {loading && (
                  <Loading />
                )}

                {!loading &&
                  orders.length ===
                    0 && (
                    <div className="py-16 flex flex-col items-center text-center">
                      <PackageCheck
                        className="w-7 h-7 text-dourado-200/30"
                        strokeWidth={
                          1.3
                        }
                      />

                      <p className="font-serif text-sm text-creme/45 mt-4">
                        Nenhum pedido encontrado.
                      </p>
                    </div>
                  )}

                {!loading &&
                  orders.length >
                    0 && (
                    <div className="flex flex-col gap-4 mt-6">

                      {orders.map(
                        (
                          order
                        ) => {
                          const processing =
                            actionId ===
                            order.id;

                          const canConfirm =
                            order.status !==
                              'cancelado' &&
                            order.payment_status !==
                              'pago';

                          const canCancel =
                            order.status !==
                            'cancelado';

                          return (
                            <article
                              key={
                                order.id
                              }
                              className="rounded-2xl border border-dourado-200/20 bg-bordo-200/45 p-5"
                            >
                              <div className="flex items-start justify-between gap-4">

                                <div>
                                  <p className="font-serif text-[9px] tracking-[0.16em] text-dourado-200/50 uppercase">
                                    Pedido
                                  </p>

                                  <h3 className="mt-1 font-serif text-xl text-creme/90">
                                    #
                                    {
                                      order.id
                                    }
                                  </h3>
                                </div>

                                <OrderStatus
                                  status={
                                    order.status
                                  }
                                  paymentStatus={
                                    order.payment_status
                                  }
                                />
                              </div>

                              <div className="mt-5 space-y-3">

                                {(order.order_items ??
                                  []).map(
                                  (
                                    item
                                  ) => (
                                    <div
                                      key={
                                        item.id
                                      }
                                      className="rounded-xl border border-dourado-200/10 bg-bordo-300/35 p-4"
                                    >
                                      <div className="flex items-start justify-between gap-3">

                                        <div>
                                          <p className="font-serif text-sm text-creme/85">
                                            {
                                              item.service_name
                                            }
                                          </p>

                                          <p className="mt-1 font-serif text-[10px] text-creme/35">
                                            {item.category ===
                                            'consulta'
                                              ? 'Consulta'
                                              : 'Tiragem'}

                                            {item.quantity >
                                            1
                                              ? ` • ${item.quantity}x`
                                              : ''}
                                          </p>
                                        </div>

                                        <span className="font-serif text-xs text-dourado-200/75 whitespace-nowrap">
                                          {Number(
                                            item.total_price
                                          ).toLocaleString(
                                            'pt-BR',
                                            {
                                              style:
                                                'currency',

                                              currency:
                                                'BRL',
                                            }
                                          )}
                                        </span>
                                      </div>

                                      {item.question && (
                                        <div className="mt-3 border-t border-dourado-200/10 pt-3">

                                          <p className="font-serif text-[9px] tracking-[0.12em] text-dourado-200/45 uppercase">
                                            Pergunta
                                          </p>

                                          <p className="mt-1.5 font-serif text-xs leading-relaxed text-creme/65">
                                            {
                                              item.question
                                            }
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>

                              <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-dourado-200/10 bg-bordo-300/25 p-4">

                                <div>
                                  <p className="font-serif text-[9px] text-creme/30 uppercase">
                                    Data
                                  </p>

                                  <p className="mt-1 font-serif text-xs text-creme/70">
                                    {formatOrderDate(
                                      order.appointment_start_at
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="font-serif text-[9px] text-creme/30 uppercase">
                                    Horário
                                  </p>

                                  <p className="mt-1 font-serif text-xs text-creme/70">
                                    {formatOrderTime(
                                      order.appointment_start_at
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="font-serif text-[9px] text-creme/30 uppercase">
                                    Duração
                                  </p>

                                  <p className="mt-1 font-serif text-xs text-creme/70">
                                    {formatDuration(
                                      order.duration_minutes
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="font-serif text-[9px] text-creme/30 uppercase">
                                    Total
                                  </p>

                                  <p className="mt-1 font-serif text-sm text-dourado-200">
                                    {Number(
                                      order.total
                                    ).toLocaleString(
                                      'pt-BR',
                                      {
                                        style:
                                          'currency',

                                        currency:
                                          'BRL',
                                      }
                                    )}
                                  </p>
                                </div>
                              </div>

                              <p className="mt-3 font-serif text-[9px] text-creme/25">
                                Criado em{' '}

                                {new Date(
                                  order.created_at
                                ).toLocaleString(
                                  'pt-BR',
                                  {
                                    timeZone:
                                      'America/Sao_Paulo',
                                  }
                                )}
                              </p>

                              {canConfirm && (
                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    confirmOrderPayment(
                                      order
                                    )
                                  }
                                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-dourado-200/35 bg-dourado-200/10 px-4 py-3.5 font-serif text-xs text-dourado-200 disabled:opacity-40"
                                >
                                  <Check className="w-4 h-4" />

                                  Confirmar pagamento
                                </button>
                              )}

                              {canCancel && (
                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    cancelOrder(
                                      order
                                    )
                                  }
                                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-red-300/15 px-4 py-3 font-serif text-xs text-red-300/65 disabled:opacity-40"
                                >
                                  <XCircle className="w-4 h-4" />

                                  Cancelar pedido
                                </button>
                              )}

                              {order.status ===
                                'cancelado' && (
                                <p className="mt-5 text-center font-serif text-xs text-creme/35">
                                  Pedido cancelado • horário liberado
                                </p>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
              </>
            )}

            {/* ========================================
                AGENDA
            ======================================== */}

            {tab === 'agenda' && (
              <>
                <div className="flex items-end justify-between mt-9 mb-5">
                  <div>
                    <p className="font-serif text-[10px] tracking-[0.22em] text-dourado-200/45 uppercase">
                      Gerenciamento
                    </p>

                    <h2 className="font-serif text-2xl text-creme/90 mt-1">
                      Agenda
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      loadAgenda
                    }
                    disabled={
                      loading
                    }
                    className="w-9 h-9 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/60 disabled:opacity-40"
                    aria-label="Atualizar agenda"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loading
                          ? 'animate-spin'
                          : ''
                      }`}
                      strokeWidth={
                        1.4
                      }
                    />
                  </button>
                </div>

                {/* DATA */}
                <div className="rounded-2xl border border-dourado-200/20 bg-bordo-200/45 p-4">

                  <div className="flex items-center gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        changeAgendaDay(
                          -1
                        )
                      }
                      className="w-10 h-10 shrink-0 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/65"
                      aria-label="Dia anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <input
                      type="date"
                      value={
                        agendaDate
                      }
                      onChange={(
                        event
                      ) =>
                        setAgendaDate(
                          event.target.value
                        )
                      }
                      className="AdminInput flex-1 text-center"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        changeAgendaDay(
                          1
                        )
                      }
                      className="w-10 h-10 shrink-0 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/65"
                      aria-label="Próximo dia"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-3 text-center font-serif text-xs text-creme/45">
                    {formatAgendaDate(
                      agendaDate
                    )}
                  </p>
                </div>

                {/* HORÁRIOS SEMANAIS */}
                <section className="mt-5 rounded-2xl border border-dourado-200/20 bg-bordo-200/35 overflow-hidden">

                  <button
                    type="button"
                    onClick={() =>
                      setShowAvailabilitySettings(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.18em] text-dourado-200/50 uppercase">
                        Horários de atendimento
                      </p>

                      <p className="mt-1 font-serif text-sm text-creme/75">
                        Configurar semana
                      </p>
                    </div>

                    <span className="font-serif text-lg text-dourado-200/55">
                      {showAvailabilitySettings
                        ? '−'
                        : '+'}
                    </span>
                  </button>

                  {showAvailabilitySettings && (
                    <div className="border-t border-dourado-200/10 px-4 pb-4">

                      <p className="py-4 font-serif text-[11px] leading-relaxed text-creme/35">
                        Ative os dias em que você atende e defina o horário de início e fim. As alterações afetam os horários disponíveis para clientes.
                      </p>

                      <div className="space-y-3">

                        {[
                          1,
                          2,
                          3,
                          4,
                          5,
                          6,
                          0,
                        ].map(
                          (
                            dayOfWeek
                          ) => {
                            const day =
                              availabilityDays.find(
                                (
                                  item
                                ) =>
                                  item.day_of_week ===
                                  dayOfWeek
                              );

                            if (!day) {
                              return null;
                            }

                            const saving =
                              savingAvailabilityDay ===
                              dayOfWeek;

                            return (
                              <div
                                key={
                                  day.id
                                }
                                className="rounded-xl border border-dourado-200/15 bg-bordo-300/30 p-4"
                              >
                                <div className="flex items-center justify-between gap-3">

                                  <div>
                                    <p className="font-serif text-sm text-creme/80">
                                      {getWeekdayName(
                                        day.day_of_week
                                      )}
                                    </p>

                                    <p className="mt-1 font-serif text-[10px] text-creme/35">
                                      {day.active
                                        ? 'Aberto para agendamentos'
                                        : 'Fechado'}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateAvailabilityLocal(
                                        day.day_of_week,
                                        {
                                          active:
                                            !day.active,
                                        }
                                      )
                                    }
                                    className={`relative w-11 h-6 rounded-full border transition ${
                                      day.active
                                        ? 'bg-dourado-200/20 border-dourado-200/50'
                                        : 'bg-bordo-300 border-creme/15'
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all ${
                                        day.active
                                          ? 'left-6 bg-dourado-200'
                                          : 'left-1 bg-creme/30'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {day.active && (
                                  <div className="grid grid-cols-2 gap-3 mt-4">

                                    <FieldLabel label="Início">
                                      <input
                                        type="time"
                                        step="1800"
                                        value={trimDatabaseTime(
                                          day.start_time
                                        )}
                                        onChange={(
                                          event
                                        ) =>
                                          updateAvailabilityLocal(
                                            day.day_of_week,
                                            {
                                              start_time:
                                                event.target.value,
                                            }
                                          )
                                        }
                                        className="AdminInput"
                                      />
                                    </FieldLabel>

                                    <FieldLabel label="Fim">
                                      <input
                                        type="time"
                                        step="1800"
                                        value={trimDatabaseTime(
                                          day.end_time
                                        )}
                                        onChange={(
                                          event
                                        ) =>
                                          updateAvailabilityLocal(
                                            day.day_of_week,
                                            {
                                              end_time:
                                                event.target.value,
                                            }
                                          )
                                        }
                                        className="AdminInput"
                                      />
                                    </FieldLabel>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    saveAvailabilityDay(
                                      day
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-dourado-200/20 px-4 py-3 font-serif text-[10px] text-dourado-200/70 disabled:opacity-40"
                                >
                                  {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Save className="w-3.5 h-3.5" />

                                      Salvar{' '}
                                      {getWeekdayName(
                                        day.day_of_week
                                      )}
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <Messages
                  error={error}
                  success={success}
                />

                {/* BLOQUEAR HORÁRIO */}
                <section className="mt-6 rounded-2xl border border-dourado-200/20 bg-bordo-200/35 p-5">

                  <p className="font-serif text-[10px] tracking-[0.18em] text-dourado-200/50 uppercase">
                    Bloquear período
                  </p>

                  <p className="mt-2 font-serif text-xs leading-relaxed text-creme/40">
                    Use para compromissos, clientes marcados fora do site ou qualquer período em que você não poderá atender.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-5">

                    <FieldLabel label="Início">
                      <input
                        type="time"
                        step="1800"
                        value={
                          agendaStartTime
                        }
                        onChange={(
                          event
                        ) =>
                          setAgendaStartTime(
                            event.target.value
                          )
                        }
                        className="AdminInput"
                      />
                    </FieldLabel>

                    <FieldLabel label="Fim">
                      <input
                        type="time"
                        step="1800"
                        value={
                          agendaEndTime
                        }
                        onChange={(
                          event
                        ) =>
                          setAgendaEndTime(
                            event.target.value
                          )
                        }
                        className="AdminInput"
                      />
                    </FieldLabel>
                  </div>

                  <div className="mt-4">
                    <FieldLabel label="Motivo">
                      <input
                        type="text"
                        value={
                          agendaReason
                        }
                        onChange={(
                          event
                        ) =>
                          setAgendaReason(
                            event.target.value
                          )
                        }
                        placeholder="Ex: Cliente particular"
                        className="AdminInput"
                      />
                    </FieldLabel>
                  </div>

                  <button
                    type="button"
                    onClick={
                      createScheduleBlock
                    }
                    disabled={
                      savingBlock
                    }
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-dourado-200/35 bg-dourado-200/10 px-4 py-3.5 font-serif text-xs text-dourado-200 disabled:opacity-40"
                  >
                    {savingBlock ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Clock3 className="w-4 h-4" />

                        Bloquear horário
                      </>
                    )}
                  </button>
                </section>

                {loading && (
                  <Loading />
                )}

                {!loading && (
                  <div className="mt-7">

                    <div className="flex items-center justify-between">

                      <h3 className="font-serif text-lg text-creme/85">
                        Compromissos do dia
                      </h3>

                      <span className="font-serif text-[10px] text-creme/30">
                        {appointments.length +
                          scheduleBlocks.length}{' '}
                        registro(s)
                      </span>
                    </div>

                    {appointments.length ===
                      0 &&
                    scheduleBlocks.length ===
                      0 ? (
                      <div className="py-12 text-center">

                        <CalendarDays
                          className="w-7 h-7 mx-auto text-dourado-200/25"
                          strokeWidth={
                            1.3
                          }
                        />

                        <p className="mt-4 font-serif text-sm text-creme/40">
                          Nenhum compromisso neste dia.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 mt-5">

                        {[
                          ...appointments.map(
                            (
                              appointment
                            ) => ({
                              kind:
                                'appointment' as const,

                              start:
                                appointment.start_at,

                              item:
                                appointment,
                            })
                          ),

                          ...scheduleBlocks.map(
                            (
                              block
                            ) => ({
                              kind:
                                'block' as const,

                              start:
                                block.start_at,

                              item:
                                block,
                            })
                          ),
                        ]
                          .sort(
                            (
                              a,
                              b
                            ) =>
                              new Date(
                                a.start
                              ).getTime() -
                              new Date(
                                b.start
                              ).getTime()
                          )
                          .map(
                            (
                              entry
                            ) => {
                              if (
                                entry.kind ===
                                'appointment'
                              ) {
                                const appointment =
                                  entry.item;

                                return (
                                  <article
                                    key={`appointment-${appointment.id}`}
                                    className="rounded-2xl border border-dourado-200/25 bg-dourado-200/5 p-4"
                                  >
                                    <div className="flex items-start justify-between gap-4">

                                      <div>
                                        <p className="font-serif text-lg text-creme/90">
                                          {formatAgendaTime(
                                            appointment.start_at
                                          )}{' '}
                                          —{' '}
                                          {formatAgendaTime(
                                            appointment.end_at
                                          )}
                                        </p>

                                        <p className="mt-1 font-serif text-[10px] text-dourado-200/55 uppercase">
                                          Pedido #
                                          {
                                            appointment.order_id
                                          }
                                        </p>
                                      </div>

                                      <span className="rounded-full border border-dourado-200/20 px-2.5 py-1 font-serif text-[9px] text-dourado-200/70 uppercase">
                                        {appointment.status ===
                                        'reservado'
                                          ? 'Aguardando'
                                          : appointment.status ===
                                              'confirmado'
                                            ? 'Confirmado'
                                            : appointment.status}
                                      </span>
                                    </div>

                                    <p className="mt-3 font-serif text-xs text-creme/40">
                                      Duração:{' '}

                                      {formatDuration(
                                        appointment.duration_minutes
                                      )}
                                    </p>
                                  </article>
                                );
                              }

                              const block =
                                entry.item;

                              return (
                                <article
                                  key={`block-${block.id}`}
                                  className="rounded-2xl border border-red-300/15 bg-bordo-200/45 p-4"
                                >
                                  <div className="flex items-start justify-between gap-4">

                                    <div>
                                      <p className="font-serif text-lg text-creme/80">
                                        {formatAgendaTime(
                                          block.start_at
                                        )}{' '}
                                        —{' '}
                                        {formatAgendaTime(
                                          block.end_at
                                        )}
                                      </p>

                                      <p className="mt-1 font-serif text-xs text-creme/45">
                                        {block.reason ||
                                          'Indisponível'}
                                      </p>
                                    </div>

                                    <span className="rounded-full border border-red-300/15 px-2.5 py-1 font-serif text-[9px] text-red-300/60 uppercase">
                                      Bloqueado
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={
                                      actionId ===
                                      block.id
                                    }
                                    onClick={() =>
                                      deleteScheduleBlock(
                                        block
                                      )
                                    }
                                    className="mt-4 w-full rounded-xl border border-dourado-200/15 px-4 py-3 font-serif text-xs text-creme/55 disabled:opacity-40"
                                  >
                                    Liberar horário
                                  </button>
                                </article>
                              );
                            }
                          )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ============================================
          MODAL NOVO / EDITAR JOGO
      ============================================ */}

      {serviceModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm overflow-y-auto">

          <div className="min-h-full flex items-end sm:items-center justify-center">

            <div className="relative w-full max-w-[480px] bg-bordo-300 border border-dourado-200/20 rounded-t-[28px] sm:rounded-[28px] px-5 pt-6 pb-8">

              {/* FECHAR */}
              <button
                type="button"
                onClick={
                  closeServiceModal
                }
                disabled={
                  savingService
                }
                className="absolute right-5 top-5 w-9 h-9 rounded-full border border-dourado-200/20 flex items-center justify-center text-dourado-200/60 disabled:opacity-40"
              >
                <X
                  className="w-4 h-4"
                  strokeWidth={1.4}
                />
              </button>

              <div className="flex items-center justify-center gap-3 mb-5">

                <div className="ornament-line w-10" />

                <span className="text-dourado-200/40 text-xs">
                  ✦
                </span>

                <div className="ornament-line w-10" />
              </div>

              <div className="text-center">

                <p className="font-serif text-[10px] tracking-[0.2em] text-dourado-200/45 uppercase">
                  Painel administrativo
                </p>

                <h2 className="font-serif text-xl text-gradient-gold mt-2">
                  {editingService
                    ? 'EDITAR JOGO'
                    : 'NOVO JOGO'}
                </h2>
              </div>

              <div className="space-y-4 mt-7">

                {/* NOME */}
                <FieldLabel label="Nome do jogo">
                  <input
                    type="text"
                    value={
                      serviceForm.nome
                    }
                    onChange={(
                      event
                    ) =>
                      setServiceForm({
                        ...serviceForm,

                        nome:
                          event.target.value,
                      })
                    }
                    placeholder="Ex: Cruz Celta"
                    className="AdminInput"
                  />
                </FieldLabel>

                {/* PREÇO + ORDEM */}
                <div className="grid grid-cols-2 gap-3">

                  <FieldLabel label="Preço (R$)">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        serviceForm.preco
                      }
                      onChange={(
                        event
                      ) =>
                        setServiceForm({
                          ...serviceForm,

                          preco:
                            event.target.value,
                        })
                      }
                      placeholder="30"
                      className="AdminInput"
                    />
                  </FieldLabel>

                  <FieldLabel label="Ordem">
                    <input
                      type="number"
                      min="1"
                      value={
                        serviceForm.ordem
                      }
                      onChange={(
                        event
                      ) =>
                        setServiceForm({
                          ...serviceForm,

                          ordem:
                            event.target.value,
                        })
                      }
                      className="AdminInput"
                    />
                  </FieldLabel>
                </div>

                {/* CATEGORIA */}
                <FieldLabel label="Categoria">
                  <select
                    value={
                      serviceForm.categoria
                    }
                    onChange={(
                      event
                    ) =>
                      setServiceForm({
                        ...serviceForm,

                        categoria:
                          event.target.value as
                            | 'consulta'
                            | 'tiragem',

                        area:
                          event.target.value ===
                          'consulta'
                            ? 'geral'
                            : serviceForm.area,
                      })
                    }
                    className="AdminInput"
                  >
                    <option value="tiragem">
                      Tiragem
                    </option>

                    <option value="consulta">
                      Consulta
                    </option>
                  </select>
                </FieldLabel>

                {/* ÁREA */}
                {serviceForm.categoria ===
                  'tiragem' && (
                  <FieldLabel label="Área da tiragem">

                    <select
                      value={
                        serviceForm.area
                      }
                      onChange={(
                        event
                      ) =>
                        setServiceForm({
                          ...serviceForm,

                          area:
                            event.target.value as ServiceArea,
                        })
                      }
                      className="AdminInput"
                    >
                      <option value="geral">
                        Geral
                      </option>

                      <option value="amor">
                        Amor
                      </option>

                      <option value="financeiro">
                        Financeiro
                      </option>

                      <option value="pessoal">
                        Pessoal
                      </option>

                      <option value="espiritual">
                        Espiritual
                      </option>

                      <option value="relacionamentos">
                        Relacionamentos
                      </option>
                    </select>
                  </FieldLabel>
                )}

                {/* ==================================
                    IMAGEM DA TIRAGEM
                ================================== */}

                {serviceForm.categoria ===
                  'tiragem' && (
                  <FieldLabel label="Imagem da tiragem">

                    <ServiceImageUpload
                      value={
                        serviceForm.imagem_url
                      }
                      onUpload={
                        handleServiceImageUpload
                      }
                      onRemove={
                        handleRemoveServiceImage
                      }
                      disabled={
                        savingService
                      }
                    />
                  </FieldLabel>
                )}

                {/* DESCRIÇÃO */}
                <FieldLabel label="Descrição">
                  <textarea
                    value={
                      serviceForm.descricao
                    }
                    onChange={(
                      event
                    ) =>
                      setServiceForm({
                        ...serviceForm,

                        descricao:
                          event.target.value,
                      })
                    }
                    rows={5}
                    placeholder="Descrição que aparecerá para a cliente..."
                    className="AdminInput resize-none py-3"
                  />
                </FieldLabel>

                {/* CONFIGURAÇÕES */}
                <div className="rounded-xl border border-dourado-200/15 bg-bordo-200/30 divide-y divide-dourado-200/10">

                  <ToggleRow
                    label="Jogo ativo"
                    description="Exibir este jogo no site"
                    checked={
                      serviceForm.ativo
                    }
                    onChange={(
                      checked
                    ) =>
                      setServiceForm({
                        ...serviceForm,

                        ativo:
                          checked,
                      })
                    }
                  />

                  <ToggleRow
                    label="Destacar"
                    description="Marcar como destaque"
                    checked={
                      serviceForm.destaque
                    }
                    onChange={(
                      checked
                    ) =>
                      setServiceForm({
                        ...serviceForm,

                        destaque:
                          checked,
                      })
                    }
                  />
                </div>
              </div>

              {error && (
                <p className="mt-5 text-center font-serif text-xs text-red-300/80">
                  {error}
                </p>
              )}

              {/* SALVAR */}
              <button
                type="button"
                onClick={
                  saveService
                }
                disabled={
                  savingService
                }
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-full border border-dourado-200/45 bg-dourado-200/10 px-5 py-3.5 font-serif text-[11px] tracking-[0.15em] text-dourado-200 uppercase disabled:opacity-40"
              >
                {savingService ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />

                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />

                    Salvar jogo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function formatServiceArea(
  area: ServiceArea
) {
  const labels: Record<
    ServiceArea,
    string
  > = {
    geral: 'Geral',

    amor: 'Amor',

    financeiro:
      'Financeiro',

    pessoal: 'Pessoal',

    espiritual:
      'Espiritual',

    relacionamentos:
      'Relacionamentos',
  };

  return (
    labels[area] ??
    'Geral'
  );
}

function getWeekdayName(
  dayOfWeek: number
) {
  const names: Record<
    number,
    string
  > = {
    0: 'Domingo',

    1: 'Segunda',

    2: 'Terça',

    3: 'Quarta',

    4: 'Quinta',

    5: 'Sexta',

    6: 'Sábado',
  };

  return (
    names[dayOfWeek] ??
    'Dia'
  );
}

function trimDatabaseTime(
  value: string
) {
  return (
    value?.slice(
      0,
      5
    ) ?? ''
  );
}

function normalizeTimeForDatabase(
  value: string
) {
  if (value.length === 5) {
    return `${value}:00`;
  }

  return value;
}

function getTodayInSaoPaulo() {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'America/Sao_Paulo',

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        'year'
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        'month'
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        'day'
    )?.value;

  return `${year}-${month}-${day}`;
}

function addDaysToDateString(
  value: string,
  days: number
) {
  const [
    year,
    month,
    day,
  ] = value
    .split('-')
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  date.setUTCDate(
    date.getUTCDate() +
      days
  );

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function saoPauloLocalToIso(
  date: string,
  time: string
) {
  return new Date(
    `${date}T${time}:00-03:00`
  ).toISOString();
}

function getSaoPauloDayRange(
  date: string
) {
  return {
    startIso:
      saoPauloLocalToIso(
        date,
        '00:00'
      ),

    endIso:
      saoPauloLocalToIso(
        addDaysToDateString(
          date,
          1
        ),
        '00:00'
      ),
  };
}

function formatAgendaDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] = value
    .split('-')
    .map(Number);

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday: 'long',

      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric',

      timeZone:
        'UTC',
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )
  );
}

function formatAgendaTime(
  value: string
) {
  return new Date(
    value
  ).toLocaleTimeString(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      hour:
        '2-digit',

      minute:
        '2-digit',
    }
  );
}

function formatOrderDate(
  value: string | null
) {
  if (!value) {
    return '—';
  }

  return new Date(
    value
  ).toLocaleDateString(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',
    }
  );
}

function formatOrderTime(
  value: string | null
) {
  if (!value) {
    return '—';
  }

  return new Date(
    value
  ).toLocaleTimeString(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      hour:
        '2-digit',

      minute:
        '2-digit',
    }
  );
}

function formatDuration(
  minutes: number | null
) {
  if (!minutes) {
    return '—';
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const rest =
    minutes % 60;

  if (
    hours > 0 &&
    rest > 0
  ) {
    return `${hours}h ${rest}min`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${rest} min`;
}

function OrderStatus({
  status,
  paymentStatus,
}: {
  status:
    Order['status'];

  paymentStatus:
    Order['payment_status'];
}) {
  if (
    status ===
    'cancelado'
  ) {
    return (
      <span className="rounded-full border border-red-300/20 bg-red-300/5 px-3 py-1.5 font-serif text-[9px] text-red-300/70 uppercase">
        Cancelado
      </span>
    );
  }

  if (
    paymentStatus ===
    'pago'
  ) {
    return (
      <span className="rounded-full border border-dourado-200/30 bg-dourado-200/10 px-3 py-1.5 font-serif text-[9px] text-dourado-200 uppercase">
        Pago ✓
      </span>
    );
  }

  return (
    <span className="rounded-full border border-dourado-200/15 px-3 py-1.5 font-serif text-[9px] text-creme/45 uppercase">
      Aguardando
    </span>
  );
}

function Loading() {
  return (
    <div className="py-16 flex justify-center">
      <Loader2
        className="w-6 h-6 text-dourado-200/60 animate-spin"
        strokeWidth={1.4}
      />
    </div>
  );
}

function Messages({
  error,
  success,
}: {
  error: string;

  success: string;
}) {
  return (
    <>
      {error && (
        <p className="mt-5 font-serif text-xs text-red-300/80 text-center">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-5 font-serif text-xs text-dourado-200/70 text-center">
          {success}
        </p>
      )}
    </>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children:
    React.ReactNode;

  active:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-full border px-2 py-2.5 font-serif text-[10px] transition ${
        active
          ? 'border-dourado-200/45 bg-dourado-200/10 text-dourado-200'
          : 'border-dourado-200/15 text-creme/40'
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;

  disabled:
    boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className="flex items-center justify-center gap-2 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-3 py-3 font-serif text-xs text-dourado-200/80 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block mb-2 font-serif text-[10px] tracking-[0.15em] text-dourado-200/55 uppercase">
        {label}
      </span>

      {children}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label:
    string;

  description:
    string;

  checked:
    boolean;

  onChange:
    (
      checked: boolean
    ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked
        )
      }
      className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left"
    >
      <div>
        <p className="font-serif text-sm text-creme/80">
          {label}
        </p>

        <p className="font-serif text-[10px] text-creme/35 mt-1">
          {description}
        </p>
      </div>

      <div
        className={`relative w-11 h-6 rounded-full border transition ${
          checked
            ? 'bg-dourado-200/20 border-dourado-200/50'
            : 'bg-bordo-300 border-creme/15'
        }`}
      >
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all ${
            checked
              ? 'left-6 bg-dourado-200'
              : 'left-1 bg-creme/30'
          }`}
        />
      </div>
    </button>
  );
}
